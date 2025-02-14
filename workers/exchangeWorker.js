const { Worker, Queue } = require('bullmq');
const Redis = require('ioredis');
const redisConnection = require('../services/redis'); // Import existing Redis connection

// Initialize Redis publisher using ioredis
const redisPublisher = new Redis();
const redisClient = new Redis(); // Redis client for storing historical data

// Queue for final transaction processing
const finalTransactionQueue = new Queue('finalTransactionQueue', {
  connection: redisConnection,
});

const marketPrices = {
  AAPL: 100.0,
  TSLA: 200.0,
};

const transactionWorker = new Worker(
  'transactionQueue',
  async (job) => {
    const transaction = job.data;

    if (transaction.type === 'market') {
      transaction.price = marketPrices[job.data.stock_symbol];
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);
    } else if (transaction.type === 'limit') {
      // Update market price
      marketPrices[job.data.stock_symbol] = transaction.price;
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);

      // 📢 Publish new price to the respective stock channel using ioredis
      const stockChannel = `stock:${job.data.stock_symbol}`;
      const stockUpdate = JSON.stringify({ price: transaction.price, timestamp: Date.now() });

      // 📊 Store historical price data in Redis for graph plotting
      // await redisClient.zadd(`history:${job.data.stock_symbol}`, job.data.timestamp, transaction.price);
      // console.log(`📊 Stored in history:${job.data.stock_symbol} -> ${transaction.price} at ${job.data.timestamp}`);

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
transactionWorker.on('completed', (job) => {
  console.log(`✅ Job completed successfully: ${job.id}`);
});

transactionWorker.on('failed', (job, err) => {
  console.error(`❌ Job failed: ${job.id}, Error: ${err.message}`);
});

console.log('📡 Third Worker Listening to Transactions...');
