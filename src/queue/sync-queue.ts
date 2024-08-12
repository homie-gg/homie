import { handlers } from '@/queue/handlers'
import { Job } from '@/queue/jobs'

/**
 * Synchronous queue that just executes the handler immediately in the
 * same process. Useful for debugging, and tests in CI.
 */
export const syncQueue = {
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
