import { RedisClientType, createClient } from 'redis'

let client: RedisClientType<any, any, any> | null

export const createRedisClient = async () => {
  if (client) {
    return client
  }

  client = await createClient({
    url: `redis://${process.env.REDIS_HOST}`,
  }).connect()

  return client
}
