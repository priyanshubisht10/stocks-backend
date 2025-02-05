const { Queue } = require('bullmq');
const redisConnection = require('./redis');
const catchAsync = require('../utils/catchasync');
const AppError = require('../utils/Apperror');

const queues = {
  'market-buy': new Queue('market-buy', { connection: redisConnection }),
  'market-sell': new Queue('market-sell', { connection: redisConnection }),
  'limit-buy': new Queue('limit-buy', { connection: redisConnection }),
  'limit-sell': new Queue('limit-sell', { connection: redisConnection }),
  'mailQueue': new Queue('mailQueue', { connection: redisConnection })
};

const addJobToQueue = catchAsync(async (queueType, jobName, jobData, options, next) => {
  try {
    const queue = queues[queueType];
    if (!queue) {
      return next(new AppError(`Queue for type ${queueType} does not exist`, 400));
    }
    await queue.add(jobName, jobData, options);
    console.log(`Added ${jobName} to ${queueType} queue`);
  } catch (err) {
    console.log(`Error adding to ${queueType} queue`, err);
  }
});

module.exports = addJobToQueue;
