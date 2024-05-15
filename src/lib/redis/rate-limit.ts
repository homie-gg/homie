import { redis } from '@/lib/redis/redis'

interface RateLimitParams {
  max: number
  durationSecs: number
}

export async function rateLimit(key: string, params: RateLimitParams) {
  const { durationSecs, max } = params

  const [current] = await redis
    .multi()
    .incr(key)
    .expire(key, durationSecs)
    .exec()

  if (typeof current !== 'number') {
    return false
  }

  if (current > max) {
    return true
  }

  return false
}
