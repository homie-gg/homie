interface QueueConfig {
  driver: 'redis' | 'sync'
  queues: Record<string, QueueOptions>
}

interface QueueOptions {
  concurrency: number
}

export const queue: QueueConfig = {
  driver: (process.env.QUEUE_DRIVER as any) ?? 'redis',
  queues: {
    default: {
      concurrency: 4,
    },
    high: {
      concurrency: 2,
    },
  },
}
