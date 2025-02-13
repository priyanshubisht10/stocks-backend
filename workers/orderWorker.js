const { Worker, Queue } = require('bullmq');
require('dotenv').config({ path: '../config.env' });
const redisConnection = require('../services/redis');
const { v4: uuidv4 } = require('uuid');

const buyOrders = [];
const sellOrders = [];

// const transactionQueue = new Queue('transactionQueue', {
//   connection: redisConnection,
// });

// Worker to listen for market-buy and market-sell queues
const marketWorker = new Worker(
  //['market-buy', 'market-sell'],
  'market-buy',
  async (job) => {
    try {
      console.log('entered try');
      const { order_id, stock_symbol, user, price, quantity, order_type } =
        job.data;

      if (order_type === 'buy') {
        buyOrders.push({ job, order_id, stock_symbol, user, price, quantity });
      } else {
        sellOrders.push({ job, order_id, stock_symbol, user, price, quantity });
      }

      console.log(`Received order in ${order_type} queue:`, job.data);
      matchOrders(); // Try to match orders
    } catch (error) {
      console.error('Error processing market order:', error);
    }
  },
  { connection: redisConnection }
);

async function matchOrders() {
  while (buyOrders.length > 0 && sellOrders.length > 0) {
    const buyOrder = buyOrders[0];
    const sellOrder = sellOrders[0];
    console.log('buyorder array:', buyOrders);
    console.log('sellorder array:', sellOrders);
    if (buyOrder.stock_symbol !== sellOrder.stock_symbol) {
      return; // Orders should match the same stock symbol
    }

    const quantityToExchange = Math.min(buyOrder.quantity, sellOrder.quantity);

    // Create transaction job data
    const transactionData = {
      transid: uuidv4(),
      buyorderid: buyOrder.order_id,
      sellorderid: sellOrder.order_id,
      quantityxchng: quantityToExchange,
      stocksymbol: buyOrder.stock_symbol,
      price: null, // Price to be determined at settlement
    };

    // Add transaction job to queue
    //await transactionQueue.add('transaction-job', transactionData);
    console.log('Transaction job added to queue:', transactionData);

    // Update remaining quantities
    buyOrder.quantity -= quantityToExchange;
    sellOrder.quantity -= quantityToExchange;

    // If buy order is fully filled, remove it from queue
    if (buyOrder.quantity === 0) {
      buyOrders.shift();
      await buyOrder.job.remove();
      console.log('after removing:::::');
      console.log('buyorder array:', buyOrders);
    } else {
      await buyOrder.job.update({
        ...buyOrder.job.data,
        quantity: buyOrder.quantity,
      });
    }

    // If sell order is fully filled, remove it from queue
    if (sellOrder.quantity === 0) {
      sellOrders.shift();
      await sellOrder.job.remove();
      console.log('after removing:::::');
      console.log('sellorder array:', sellOrders);
    } else {
      await sellOrder.job.update({
        ...sellOrder.job.data,
        quantity: sellOrder.quantity,
      });
    }
  }
}