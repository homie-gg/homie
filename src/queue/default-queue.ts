import { Job } from '@/queue/jobs'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

let defaultQueue: Queue | null = null

export const defaultQueueName = 'default'

export const getDefaultQueue = () => {
  if (defaultQueue) {
    return defaultQueue
  }

  const connection = new Redis(process.env.REDIS_HOST!, {
    maxRetriesPerRequest: null,
  })

  defaultQueue = new Queue<Job['data'], Job['returnvalue'], Job['name']>(
    defaultQueueName,
    {
      connection,
      defaultJobOptions: {
        attempts: 3,
        backoff: {
          type: 'exponential',
          delay: 5000,
        },
      },
    },
  )

  return defaultQueue
}
