import { config } from '@/config'
import { handlers } from '@/queue/handlers'
import { Job } from '@/queue/jobs'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

let defaultQueue: Queue<Job['data'], Job['returnvalue'], Job['name']> | null =
  null

export const defaultQueueName = 'default'

export const getDefaultQueue = () => {
  if (config.queue.driver === 'sync') {
    return {
      add: async (job: Job['name'], data: Job['data'], opts?: Job['opts']) => {
        const handler = handlers[job]
        if (!handler) {
          throw new Error(`Missing job handler: ${job}`)
        }

        await handler({ name: job, data, opts } as any)
      },
      getRepeatableJobs: () => [],
      removeRepeatableByKey: (_key: string) => {},
    }
  }

  if (defaultQueue) {
    return defaultQueue
  }

  const connection = new Redis(process.env.REDIS_HOST!, {
    maxRetriesPerRequest: null,
  })

  defaultQueue = new Queue(defaultQueueName, {
    connection,
    defaultJobOptions: {
      attempts: 3,
      backoff: {
        type: 'exponential',
        delay: 5000,
      },
    },
  })

  return defaultQueue
}
