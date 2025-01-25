const { Queue } = require('bullmq')
const Redis = require('ioredis')

const redisConnection = require('../services/redis');

const mailQueue = new Queue('mailQueue', { connection: redisConnection })


exports.addMailJob = async (jobdata) => {
  try {
    await mailQueue.add('sendMail', jobdata, {
      attempts: 2,
      backoff: 60000,
    });
    
    //console.log('Mail job added to the queue:', jobdata,priority);
    console.log("added in queue");
  } catch (err) {
    console.error('Error adding mail job:', err);
  }
}