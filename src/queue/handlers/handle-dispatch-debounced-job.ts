import { createRedisClient } from '@/lib/redis/create-redis-client'
import { dispatch } from '@/queue/default-queue'
import { DispatchDebouncedJob } from '@/queue/jobs'

export async function handleDispatchDebouncedJob(job: DispatchDebouncedJob) {
  const { job: targetJob, debounce } = job.data

  const redis = await createRedisClient()

  const currentId = await redis.get(debounce.key)

  // If another id exists, then we can assume another job has been dispatched
  // so we'll ignore this one.
  if (currentId && currentId !== debounce.id) {
    return
  }

  await dispatch(targetJob.name, targetJob.data, targetJob.opts)
}
