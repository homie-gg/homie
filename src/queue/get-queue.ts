import { getQueueOptions } from '@/queue/get-queue-options'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const queues: Record<string, Queue> = {}

export const getQueue = (name: string) => {
  // Assert queue is defined
  getQueueOptions(name)

  const existingQueue = queues[name]
  if (existingQueue) {
    return existingQueue
  }

  const connection = new Redis(process.env.REDIS_HOST!, {
    maxRetriesPerRequest: null,
  })

  const queue = new Queue(name, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  })

  queues[name] = queue

  return queue
}
