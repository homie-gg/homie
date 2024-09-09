import { createRedisClient } from '@/lib/redis/create-redis-client'
import { dispatch, DispatchOptions } from '@/queue/dispatch'

interface DebouncedDispatchParams {
  job: {
    name: string
    data: any
    options?: DispatchOptions
  }
  debounce: {
    key: string
    id: string
    /**
     * How long to wait before the job is executed. If another job is
     * dispatched before the delay expies, then this job will be
     * skipped.
     */
    delaySecs: number
  }
}

export async function debouncedDispatch(params: DebouncedDispatchParams) {
  const { job, debounce } = params
  const { options } = job

  const redis = await createRedisClient()

  await redis
    .multi()
    .set(debounce.key, debounce.id)
    .expire(debounce.key, debounce.delaySecs + 5) // +5 max secs before key is set (arbitrary)
    .exec()

  await dispatch(
    'dispatch_debounced_job',
    {
      job,
      debounce,
    },
    {
      delay: debounce.delaySecs * 1000,
      ...options,
    },
  )
}
