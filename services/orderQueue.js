const { Queue } = require('bullmq');
const redisConnection = require('./redis');

const marketBuyQueue = new Queue('market-buy', { connection: redisConnection });
const limitBuyQueue = new Queue('limit-buy', { connection: redisConnection });
const limitSellQueue = new Queue('limit-sell', { connection: redisConnection });
const marketSellQueue = new Queue('market-sell', {
  connection: redisConnection,
});

const addOrderToQueue = async (queue, jobName, jobData) => {
  try {
    await queue.add(jobName, jobData);
    console.log('adding to queue');
  } catch (err) {
    console.error(`Error adding to ${jobName} with data ${jobData} queue`, err);
  }
};

exports.addMarketBuyOrder = async (jobData) => {
  addOrderToQueue(marketBuyQueue, 'market-buy-order', jobData);
};

exports.addMarketSellOrder = async (jobData) => {
  addOrderToQueue(marketSellQueue, 'market-sell-order', jobData);
};

exports.addLimitBuyOrder = async (jobData) => {
  addOrderToQueue(limitBuyQueue, 'limit-buy-order', jobData);
};

exports.addLimitSellOrder = async (jobData) => {
  addOrderToQueue(limitSellQueue, 'limit-sell-order', jobData);
};
