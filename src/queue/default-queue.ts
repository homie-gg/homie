import { Job } from '@/queue/jobs'
import { Worker, Queue } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

export const defaultQueueName = 'default'

export const defaultQueue = new Queue<
  Job['data'],
  Job['returnvalue'],
  Job['name']
>(defaultQueueName, {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 5000,
    },
  },
})
