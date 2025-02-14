const { Worker } = require('bullmq');
const redisConnection = require('../services/redis');
require('dotenv').config({ path: '../config.env' });
const db = require('../services/db');

const orderModel = db.Order;
const dematAccount = db.DematAccount;
const transactionModel = db.Transaction;

const dbWorker = new Worker(
  'finalTransactionQueue',
  async (job) => {
    const {
      stock_symbol,
      buyorderid,
      sellorderid,
      buyer,
      seller,
      price,
      quantity,
    } = job.data;
    const totalAmount = price * quantity;
    const executionTime = new Date(); // Capture execution timestamp

    try {
      console.log(job.data);
      await transactionModel.create({
        stock_symbol: job.data.stock_symbol,
        buy_order_id: job.data.buyorderid,
        sell_order_id: job.data.sellorderid,
        buy_user_id: job.data.buyer,
        sell_user_id: job.data.seller,
        price: job.data.price,
        type : job.data.type,
        quantity: job.data.quantity,
        total_value: job.data.price * job.data.quantity,
        status: 'completed',
      });

      const buyOrder = await orderModel.findOne({
        where: { order_id: buyorderid },
      });
      const sellOrder = await orderModel.findOne({
        where: { order_id: sellorderid },
      });

      if (!buyOrder || !sellOrder)
        throw new Error('Buy or Sell Order not found');

      const updatedBuyMatchedOrders = buyOrder.matched_order_id
        ? [...buyOrder.matched_order_id, sellorderid]
        : [sellorderid];

      const updatedSellMatchedOrders = sellOrder.matched_order_id
        ? [...sellOrder.matched_order_id, buyorderid]
        : [buyorderid];

      const updatedBuyFilledQty = buyOrder.filled_quantity + quantity;
      const updatedSellFilledQty = sellOrder.filled_quantity + quantity;

      const buyOrderStatus =
        updatedBuyFilledQty === buyOrder.quantity
          ? 'completed'
          : 'partially_filled';
      const sellOrderStatus =
        updatedSellFilledQty === sellOrder.quantity
          ? 'completed'
          : 'partially_filled';

      await orderModel.update(
        {
          filled_quantity: updatedBuyFilledQty,
          status: buyOrderStatus,
          matched_order_id: updatedBuyMatchedOrders,
          execution_time: executionTime, // Save execution timestamp
          price: price,
          total_value: totalAmount,
        },
        { where: { order_id: buyorderid } }
      );

      await orderModel.update(
        {
          filled_quantity: updatedSellFilledQty,
          status: sellOrderStatus,
          matched_order_id: updatedSellMatchedOrders,
          execution_time: executionTime, // Save execution timestamp
          price: price,
          total_value: totalAmount,
        },
        { where: { order_id: sellorderid } }
      );

      const buyerAccount = await dematAccount.findOne({
        where: { user_id: buyer },
      });
      const sellerAccount = await dematAccount.findOne({
        where: { user_id: seller },
      });

      if (!buyerAccount || !sellerAccount)
        throw new Error('Buyer or seller Demat account not found');

      await dematAccount.update(
        { balance: buyerAccount.balance - totalAmount },
        { where: { user_id: buyer } }
      );

      await dematAccount.update(
        { balance: sellerAccount.balance + totalAmount },
        { where: { user_id: seller } }
      );


      const buyerUser = await userModel.findByPk(buyer);
      if (!buyerUser) throw new Error('Buyer user not found');

      let ownedStocks = buyerUser.owned_stocks || [];

      // Check if buyer already owns the stock
      const stockIndex = ownedStocks.findIndex((stock) => stock.symbol === stock_symbol);
      if (stockIndex !== -1) {
        // If exists, update the quantity
        ownedStocks[stockIndex].quantity += quantity;
      } else {
        // If not, add a new entry
        ownedStocks.push({ symbol: stock_symbol, quantity });
      }

      // Update buyer's owned stocks
      await userModel.update(
        { owned_stocks: ownedStocks },
        { where: { id: buyer } }
      );

      await job.remove();

      console.log(
        '✅ Transaction saved, orders updated, and accounts adjusted:',
        job.data
      );
    } catch (error) {
      console.error('❌ Database Worker Error:', error);
    }
  },
  {
    connection: redisConnection,
  }
);

dbWorker.on('completed', (job) => {
  console.log(`✅ Job completed successfully: ${job.id}`);
});

dbWorker.on('failed', (job, err) => {
  console.error(`❌ Job failed: ${job.id}, Error: ${err.message}`);
});

console.log('📡 Database Worker Listening for Final Transactions...');
