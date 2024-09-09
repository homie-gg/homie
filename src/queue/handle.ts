import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { logger } from '@/lib/log/logger'
import { Job as BullMQJob } from 'bullmq'
import { getQueueOptions } from '@/queue/get-queue-options'
import { config } from '@/config'
import { getJobs } from '@/queue/get-jobs'
;(async () => {
  const jobs = await getJobs()

  for (const queue in config.queue.queues) {
    const connection = new Redis(process.env.REDIS_HOST!, {
      maxRetriesPerRequest: null,
    })

    const options = getQueueOptions(queue)

    new Worker(
      queue,
      async (job: BullMQJob) => {
        logger.debug(`got job: ${job.name}`, {
          event: 'job.start',
          data: JSON.stringify(job.data),
        })
        const definedJob = jobs[job.name]
        if (!definedJob) {
          logger.debug(`Missing job handler" ${job.name}`, {
            event: 'job.missing_handler',
            data: JSON.stringify(job.data),
          })
          return
        }

        try {
          const result = await definedJob.handle(job.data as any) // Ignore TS, as already type-safe when accessing hadnle
          logger.debug(`Completed job: ${job.name}`, {
            event: 'job.complete',
            data: JSON.stringify(job.data),
            result,
          })
          return result
        } catch (error: unknown) {
          if (error instanceof Error) {
            logger.debug(`Failed job: ${job.name}`, {
              event: 'job.failed',
              data: JSON.stringify(job.data),
              error: error.message,
              stack: error.stack,
            })

            throw error
          }

          logger.debug(`Failed job: ${job.name}`, {
            event: 'job.failed',
            data: JSON.stringify(job.data),
            error,
          })

          throw error
        }
      },
      {
        connection,
        concurrency: options.concurrency,
        removeOnComplete: { count: 1000 },
        removeOnFail: { count: 5000 },
      },
    ) as any

    // eslint-disable-next-line no-console
    console.log(`Worker running jobs on "${queue}".`)
  }
})()
