interface Config {
  queue: {
    driver: 'redis' | 'sync'
  }
}

export const config: Config = {
  queue: {
    driver: process.env.QUEUE_DRIVER ?? 'redis',
  },
} as any
