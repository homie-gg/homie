import { config } from '@/config'
import { getQueueOptions } from '@/queue/get-queue-options'
import { handlers } from '@/queue/handlers'
import { Job } from '@/queue/jobs'
import { Queue } from 'bullmq'
import Redis from 'ioredis'

const queues: Record<
  string,
  Queue<Job['data'], Job['returnvalue'], Job['name']>
> = {}

export const getQueue = (name: string) => {
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
      remove: (_key: string) => {},
    }
  }

  // Assert queue is defined
  getQueueOptions(name)

  const existingQueue = queues[name]
  if (existingQueue) {
    return existingQueue
  }

  const connection = new Redis(process.env.REDIS_HOST!, {
    maxRetriesPerRequest: null,
  })

  const queue = new Queue<Job['data'], Job['returnvalue'], Job['name']>(name, {
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

export type GetDataType<
  SomeJob extends Job,
  Name extends SomeJob['name'],
> = SomeJob extends {
  name: Name
  data: infer InferredData
}
  ? InferredData
  : never
