import { createRedisClient } from '@/lib/redis/create-redis-client'
import { GetDataType, dispatch } from '@/queue/default-queue'
import { Job } from '@/queue/jobs'
import { JobsOptions } from 'bullmq'

interface DebouncedDispatchParams<TJob extends Job, Name extends TJob['name']> {
  job: {
    name: Name
    data: GetDataType<TJob, Name>
    opts?: JobsOptions
  }
  debounce: {
    key: string
    id: string
    delaySecs: number
  }
}

export async function debouncedDispatch<
  TJob extends Job,
  Name extends TJob['name'],
>(params: DebouncedDispatchParams<TJob, Name>) {
  const { job, debounce } = params

  const redis = await createRedisClient()

  await redis
    .multi()
    .set(debounce.key, debounce.id)
    .expire(debounce.key, debounce.delaySecs + 5)
    .exec()

  await dispatch(
    'dispatch_debounced_job',
    {
      job,
      debounce,
    },
    {
      delay: debounce.delaySecs * 1000,
    },
  )
}
