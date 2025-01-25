const { Worker, Queue } = require('bullmq');
require('dotenv').config({ path: '../config.env' });
const { sendEmail } = require('../services/mailService');

const redisConnection = require('../services/redis');

const dlqueue = new Queue('deadLetterQueue', { connection: redisConnection });
const emailWorker = new Worker(
  'mailQueue',
  async (job) => {
    console.log("Worker started processing job:");
    try {
      console.log("entered");
      await sendEmail(job.data);
    } catch (error) {
      console.error(`Error sending email for job ${job.id}:`, error.message);
      throw error;
    }
  },
  {
    connection: redisConnection,
    settings: {
      retryProcessDelay: 1000,
    },
  }
);
emailWorker.on('failed', async (job, err) => {
  if (job.attemptsMade >= job.opts.attempts) {
    console.log(`Pushing job ${job.id} to dead-letter queue after retries.`);
    await dlqueue.add('failedMailJob', {
      jobId: job.id,
      data: job.data,
      failedReason: err.message,
    });
  }
});

emailWorker.on('completed', (job) => {
  console.log(`Job ${job.id} completed successfully.`);
});

const dlQueueWorker = new Worker(
  'deadLetterQueue',
  async (job) => {
    console.log(`Processing job in dead-letter queue:`, job.data);
  },
  { connection: redisConnection }
);

dlQueueWorker.on('completed', (job) => {
  console.log(`Dead-letter queue job ${job.id} processed.`);
});

dlQueueWorker.on('failed', (job, err) => {
  console.error(`Dead-letter queue job ${job.id} failed:`, err.message);
});
