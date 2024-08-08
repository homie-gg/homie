import { config } from '@/config'

export function getQueueOptions(name: string) {
  const options = config.queue.queues[name]
  if (!options) {
    throw new Error(
      `Queue with name "${name}" is not defined in config/queue.ts.`,
    )
  }

  return options
}
