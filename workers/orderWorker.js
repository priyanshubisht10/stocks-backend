const Redis = require('ioredis');
const redis = new Redis({ host: '127.0.0.1', port: 6379 });
const subscriber = new Redis({ host: '127.0.0.1', port: 6379 });

const processOrder = async (stock_symbol) => {
  console.log("Inside processOrder for:", stock_symbol);

  const buyQueue = `market-buy-${stock_symbol}`;
  const sellQueue = `market-sell-${stock_symbol}`;

  while (true) {
    let buyOrder = await redis.lindex(buyQueue, 0);
    let sellOrder = await redis.lindex(sellQueue, 0);

    if (!buyOrder || !sellOrder) {
      console.log(`No match found for ${stock_symbol}. Exiting loop.`);
      return; // Exit loop if no matching orders
    }

    let buyData = JSON.parse(buyOrder);
    let sellData = JSON.parse(sellOrder);

    console.log('📥 Buy Order:', buyData);
    console.log('📤 Sell Order:', sellData);

    while (buyData.quantity > 0 && sellData.quantity > 0) {
      const tradeQuantity = Math.min(buyData.quantity, sellData.quantity);

      // Create a new transaction
      const transaction = {
        stock_symbol,
        buyorderid: buyData.order_id,
        buyer: buyData.user,
        sellorderid: sellData.order_id,
        seller: sellData.user,
        price: sellData.price, // Assume sell price is the execution price
        quantity: tradeQuantity,
        trade_time: new Date().toISOString(),
      };

      console.log("🚀 Trade Executed:", transaction);

      // Update remaining quantity
      buyData.quantity -= tradeQuantity;
      sellData.quantity -= tradeQuantity;

      // If the sell order is fully executed, remove it and get the next one
      if (sellData.quantity === 0) {
        await redis.lpop(sellQueue);
        sellOrder = await redis.lindex(sellQueue, 0);
        sellData = sellOrder ? JSON.parse(sellOrder) : null;
      } else {
        await redis.lset(sellQueue, 0, JSON.stringify(sellData));
      }

      // If the buy order is fully executed, remove it and get the next one
      if (buyData.quantity === 0) {
        await redis.lpop(buyQueue);
        buyOrder = await redis.lindex(buyQueue, 0);
        buyData = buyOrder ? JSON.parse(buyOrder) : null;
      } else {
        await redis.lset(buyQueue, 0, JSON.stringify(buyData));
      }

      // If there are no more matching orders, break the loop
      if (!buyData || !sellData) {
        return;
      }
    }
  }
};

// Subscribe to Redis Pub/Sub for new orders
subscriber.subscribe('order_added', (err, count) => {
  if (err) {
    console.error('Subscription failed:', err);
  } else {
    console.log(`Subscribed to ${count} channels.`);
  }
});

subscriber.on('message', async (channel, message) => {
  if (channel === 'order_added') {
    const { stock_symbol } = JSON.parse(message);
    console.log(`New order event received for: ${stock_symbol}`);
    await processOrder(stock_symbol);
  }
});
