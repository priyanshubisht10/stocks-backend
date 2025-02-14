const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');
const redisConnection = require('../services/redis'); // Import existing Redis connection

// Initialize Redis clients
const redisPublisher = new Redis();
const redisClient = new Redis(); // Redis client for storing historical data

// Queue for final transaction processing
const finalTransactionQueue = new Queue('finalTransactionQueue', {
  connection: redisConnection,
});

// Store latest market prices
const marketPrices = {};

// Local storage for high and low prices
const highMarketPrices = {};
const lowMarketPrices = {};

// Function to fetch and initialize high/low prices from Redis based on trade history
const loadLatestPrices = async () => {
  console.log('🔄 Fetching latest stock prices and high/low from Redis history...');

  const stockSymbols = ['JAE', 'PB']; // Add all stock symbols here
  for (const symbol of stockSymbols) {
    const historyKey = `history:${symbol}`;
    const highLowKey = `dayHighLow:${symbol}`;

    // Fetch latest market price
    const latestEntry = await redisClient.zrevrange(historyKey, 0, 0);
    if (latestEntry.length > 0) {
      const latestData = JSON.parse(latestEntry[0]);
      marketPrices[symbol] = latestData.price;
      console.log(`✅ Loaded latest price for ${symbol}: ${latestData.price}`);
    } else {
      console.log(`⚠️ No history found for ${symbol}, using default price.`);
      marketPrices[symbol] = 100.0; // Default fallback price
    }

    // Fetch existing high/low values from Redis
    const storedHighLow = await redisClient.hgetall(highLowKey);
    highMarketPrices[symbol] = storedHighLow.day_high ? parseFloat(storedHighLow.day_high) : marketPrices[symbol];
    lowMarketPrices[symbol] = storedHighLow.day_low ? parseFloat(storedHighLow.day_low) : marketPrices[symbol];

    console.log(`📊 Initial High/Low for ${symbol}: High=${highMarketPrices[symbol]}, Low=${lowMarketPrices[symbol]}`);
  }
};

// **Run this before starting the worker**
loadLatestPrices().then(() => {
  console.log('🚀 Stock prices and history-based high/low loaded. Starting Worker...');
});

// Transaction Worker
const transactionWorker = new Worker(
  'transactionQueue',
  async (job) => {
    const transaction = job.data;
    const stockSymbol = transaction.stock_symbol;
    const transactionPrice = transaction.price;
    const historyKey = `history:${stockSymbol}`;
    const highLowKey = `dayHighLow:${stockSymbol}`;
    const timestamp = Date.now();

    if (transaction.type === 'market') {
      transaction.price = marketPrices[stockSymbol];
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);
    } else if (transaction.type === 'limit') {
      // Update market price
      marketPrices[stockSymbol] = transaction.price;
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);

      // Determine updated high/low prices using Math.max and Math.min
      const newHigh = Math.max(highMarketPrices[stockSymbol] || transactionPrice, transactionPrice);
      const newLow = Math.min(lowMarketPrices[stockSymbol] || transactionPrice, transactionPrice);

      let highChanged = newHigh !== highMarketPrices[stockSymbol];
      let lowChanged = newLow !== lowMarketPrices[stockSymbol];

      // Update local storage
      highMarketPrices[stockSymbol] = newHigh;
      lowMarketPrices[stockSymbol] = newLow;

      // Store updated data in Redis history
      const stockUpdate = JSON.stringify({
        price: transactionPrice,
        timestamp,
        day_high: newHigh,
        day_low: newLow,
      });

      await redisClient.zadd(historyKey, timestamp, stockUpdate);
      console.log(`📊 Stored in history:${stockSymbol} -> ${transactionPrice} at ${timestamp}`);

      // Update Redis if high/low changed
      if (highChanged || lowChanged) {
        await redisClient.hset(highLowKey, 'day_high', newHigh, 'day_low', newLow);
        console.log(`📈 Updated High/Low in Redis for ${stockSymbol}: High=${newHigh}, Low=${newLow}`);
      }

      // Publish price update to stock channel
      const stockChannel = `stock:${stockSymbol}`;
      await redisPublisher.publish(stockChannel, stockUpdate);
      console.log(`📡 Published price update to ${stockChannel}:`, stockUpdate);
    } else {
      console.log('❌ Error processing transaction at the exchange.');
    }
  },
  {
    connection: redisConnection,
  }
);

// Event listeners
transactionWorker.on('completed', async(job) => {
  console.log(`✅ Job completed successfully: ${job.id}`);
  await job.remove()
  console.log('job removed')
});

transactionWorker.on('failed', async(job, err) => {
  console.error(`❌ Job failed: ${job.id}, Error: ${err.message}`);
  await job.remove
});

console.log('📡 Third Worker Listening to Transactions...');
