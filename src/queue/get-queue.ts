import { getQueueOptions } from '@/queue/get-queue-options'
import { Job } from '@/queue/jobs'
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
