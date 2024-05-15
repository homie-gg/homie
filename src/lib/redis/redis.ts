import { createClient } from 'redis'

export const redis = await createClient({
  url: `redis://${process.env.REDIS_HOST}:6379`,
}).connect()
