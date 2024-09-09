import { createJob } from '@/queue/create-job'

import { createRedisClient } from '@/lib/redis/create-redis-client'
import { dispatch } from '@/queue/dispatch'
import { JobsOptions } from 'bullmq'

export const dispatchDebouncedJob = createJob({
  id: 'dispatch_debounced_job',
  handle: async (payload: {
    job: {
      name: string
      data: any
      opts?: JobsOptions
    }
    debounce: {
      key: string
      id: string
      delaySecs: number
    }
  }) => {
    const { job: targetJob, debounce } = payload

    const redis = await createRedisClient()

    const currentId = await redis.get(debounce.key)

    // If another id exists, then we can assume another job has been dispatched
    // so we'll ignore this one.
    if (currentId && currentId !== debounce.id) {
      return
    }

    await dispatch(targetJob.name, targetJob.data, targetJob.opts)
  },
})
