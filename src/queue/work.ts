import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { Job } from '@/queue/jobs'
import { logger } from '@/lib/log/logger'
import { handlers } from '@/queue/handlers'
import { getQueueOptions } from '@/queue/get-queue-options'
import { config } from '@/config'
;(async () => {
  for (const queue in config.queue.queues) {
    const connection = new Redis(process.env.REDIS_HOST!, {
      maxRetriesPerRequest: null,
    })

    const options = getQueueOptions(queue)

    new Worker(
      queue,
      async (job: Job) => {
        logger.debug(`got job: ${job.name}`, {
          event: 'job.start',
          data: job.data,
        })
        const handle = handlers[job.name]
        if (!handle) {
          logger.debug(`Missing job handler" ${job.name}`, {
            event: 'job.missing_handler',
            data: job.data,
          })
          return
        }

        try {
          const result = await handle(job as any) // Ignore TS, as already type-safe when accessing hadnle
          logger.debug(`Completed job: ${job.name}`, {
            event: 'job.complete',
            data: job.data,
            result,
          })
          return result
        } catch (error: unknown) {
          if (error instanceof Error) {
            logger.debug(`Failed job: ${job.name}`, {
              event: 'job.failed',
              data: job.data,
              error: error.message,
              stack: error.stack,
            })

            throw error
          }

          logger.debug(`Failed job: ${job.name}`, {
            event: 'job.failed',
            data: job.data,
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