import { config } from '@/config'
import { handlers } from '@/queue/handlers'
import { Job } from '@/queue/jobs'
import { JobsOptions, Queue } from 'bullmq'
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

type GetDataType<
  SomeJob extends Job,
  Name extends SomeJob['name'],
> = SomeJob extends {
  name: Name
  data: infer InferredData
}
  ? InferredData
  : never

export const dispatch = async <TJob extends Job, Name extends TJob['name']>(
  name: Name,
  data: GetDataType<TJob, Name>,
  opts?: JobsOptions,
) => {
  return getDefaultQueue().add(name, data, opts)
}
