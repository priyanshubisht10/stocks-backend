const Redis = require('ioredis');
const subscriber = new Redis({ host: '127.0.0.1', port: 6379 });
const redis = new Redis({ host: '127.0.0.1', port: 6379 });

const { Queue } = require('bullmq');
const transactionQueue = new Queue('transactionQueue', {
   connection: { host: '127.0.0.1', port: 6379 },
});

// Function to match limit orders
async function matchLimitOrders(stock_symbol) {
   console.log(`🔄 Starting order matching for: ${stock_symbol}`);

   const buyQueue = `limit-buy-${stock_symbol}`;
   const sellQueue = `limit-sell-${stock_symbol}`;

   while (true) {
      console.log(`🔍 Fetching best buy and sell orders for: ${stock_symbol}`);

      // Fetch the best buy order (highest price)
      const bestBuyOrder = await redis.zrevrange(buyQueue, 0, 0, 'WITHSCORES');
      console.log(`📥 Best buy order fetched: ${JSON.stringify(bestBuyOrder)}`);

      const buyOrder = bestBuyOrder.length > 0 ? JSON.parse(bestBuyOrder[0]) : null;
      console.log(`📝 Parsed buy order: ${JSON.stringify(buyOrder)}`);

      // Fetch the best sell order (lowest price)
      const bestSellOrder = await redis.zrange(sellQueue, 0, 0, 'WITHSCORES');
      console.log(`📤 Best sell order fetched: ${JSON.stringify(bestSellOrder)}`);

      const sellOrder = bestSellOrder.length > 0 ? JSON.parse(bestSellOrder[0]) : null;
      console.log(`📝 Parsed sell order: ${JSON.stringify(sellOrder)}`);

      // Check if a match is possible
      if (!buyOrder || !sellOrder || buyOrder.price < sellOrder.price) {
         console.log(`❌ No match found for ${stock_symbol}. Exiting loop.`);
         return; // Exit if no matching orders
      }

      console.log(`✅ Match found for ${stock_symbol}: Buy @ ${buyOrder.price}, Sell @ ${sellOrder.price}`);

      // Calculate the trade quantity
      const tradeQuantity = Math.min(buyOrder.quantity, sellOrder.quantity);
      console.log(`🧮 Trade quantity calculated: ${tradeQuantity}`);

      // Execute the trade
      const transaction = {
         stock_symbol,
         buyorderid: buyOrder.order_id,
         buyer: buyOrder.user,
         sellorderid: sellOrder.order_id,
         seller: sellOrder.user,
         price: sellOrder.price, // Use the sell price as the execution price
         quantity: tradeQuantity,
         trade_time: new Date().toISOString(),
      };

      console.log("🚀 Trade Executed:", transaction);
      await transactionQueue.add('newTransaction', transaction);
      console.log(`📝 Transaction added to queue: ${JSON.stringify(transaction)}`);

      // Update partially matched orders
      if (buyOrder.quantity - tradeQuantity > 0) {
         console.log(`🔄 Updating partially matched buy order: ${buyOrder.order_id}`);
         buyOrder.quantity -= tradeQuantity;
         const buyScore = (buyOrder.price * 1e12) + (buyOrder.timeStamp * 1e6) + buyOrder.quantity;
         await redis.zadd(buyQueue, buyScore, JSON.stringify(buyOrder));
         console.log(`📝 Updated buy order in Redis: ${JSON.stringify(buyOrder)}`);
      }
      console.log(`🔄 Updated quantities - Buy: ${buyOrder.quantity}, Sell: ${sellOrder.quantity}`);

      if (sellOrder.quantity - tradeQuantity > 0) {
         console.log(`🔄 Updating partially matched sell order: ${sellOrder.order_id}`);
         sellOrder.quantity -= tradeQuantity;
         const sellScore = (sellOrder.price * 1e12) + (sellOrder.timeStamp * 1e6) + sellOrder.quantity;
         await redis.zadd(sellQueue, sellScore, JSON.stringify(sellOrder));
         console.log(`📝 Updated sell order in Redis: ${JSON.stringify(sellOrder)}`);
      }
      // Remove fully matched orders
      if (buyOrder.quantity - tradeQuantity === 0) {
         console.log(`🧹 Removing fully matched buy order: ${buyOrder.order_id}`);
         const removed = await redis.zrem(buyQueue, JSON.stringify(buyOrder));
         console.log(`✅ Removed buy order: ${removed}`); // Should log 1 if successful
      }
      if (sellOrder.quantity - tradeQuantity === 0) {
         console.log(`🧹 Removing fully matched sell order: ${sellOrder.order_id}`);
         const removed = await redis.zrem(sellQueue, JSON.stringify(sellOrder));
         console.log(`✅ Removed sell order: ${removed}`); // Should log 1 if successful
      }
   }
}

// Subscribe to the 'order_added_limit' channel
subscriber.subscribe('order_added_limit', (err, count) => {
   if (err) {
      console.error('❌ Subscription failed:', err);
   } else {
      console.log(`✅ Subscribed to ${count} channels.`);
   }
});

// Listen for messages on the 'order_added_limit' channel
subscriber.on('message', async (channel, message) => {
   if (channel === 'order_added_limit') {
      console.log(`📨 New message received on channel '${channel}': ${message}`);
      const { stock_symbol } = JSON.parse(message);
      console.log(`🔔 New limit order event received for: ${stock_symbol}`);
      await matchLimitOrders(stock_symbol);
   }
});

console.log('🚀 Limit order worker started and listening for events...');