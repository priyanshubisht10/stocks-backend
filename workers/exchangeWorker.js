const { Worker, Queue } = require('bullmq');
const redisConnection = require('../services/redis'); // Import existing Redis client

// Queue for final transaction processing
const finalTransactionQueue = new Queue('finalTransactionQueue', {
  redisConnection,
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
      marketPrices[job.data.stock_symbol] = transaction.price;
      await finalTransactionQueue.add('finalTransaction', transaction);
      console.log('📈 Updated Transaction:', transaction);
    } else {
      console.log('Error processing transaction at the exchange.');
    }

    //console.log(job.data);
    // console.log(marketPrices[job.data.stock_symbol]);
    //console.log('📈 Updated Transaction:', transaction);

  },
  {
    connection: redisConnection,
  }
);

transactionWorker.on('completed', (job) => {
  console.log(`✅ Job completed successfully: ${job.id}`);
});

transactionWorker.on('failed', (job, err) => {
  console.error(`❌ Job failed: ${job.id}, Error: ${err.message}`);
});

console.log('📡 Third Worker Listening to Transactions...');
