const { Queue } = require('bullmq')
const Redis = require('ioredis')

const redisConnection = new Redis()

const mailQueue = new Queue('mailQueue' , {connection : redisConnection})


exports.addMailJob = async (jobdata, priority = 1)=>{
    try {
        await mailQueue.add('sendMail', jobdata, {
          attempts: 2, 
          backoff: 60000,
          priority : priority 
        });
        console.log('Mail job added to the queue:', jobdata,priority);
      } catch (err) {
        console.error('Error adding mail job:', err);
      }
}