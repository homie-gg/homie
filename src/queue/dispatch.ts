import { config } from '@/config'
import { generateUuid } from '@/lib/crypto/generate-uuid'
import { debouncedDispatch } from '@/queue/debounced-dispatch'
import { GetDataType, getQueue } from '@/queue/get-queue'
import { Job } from '@/queue/jobs'
import { syncQueue } from '@/queue/sync-queue'
import { JobsOptions } from 'bullmq'

export interface DispatchOptions extends JobsOptions {
  queue?: string
  /**
   * Whether to debounce dispatches, and only execute the latest dispatch
   * after a specified amount of time.
   */
  debounce?: DebounceOptions
}

interface DebounceOptions {
  /**
   * All dispatches with the same key will be debounced together.
   */
  key: string
  /**
   * Unique job id. Specify the same ID to have the debounce skip the delay
   * if it aws already dispatched earlier.
   */
  id?: string
  /**
   * How long to wait until no further dispatches before executing.
   */
  delaySecs: number
}

export const dispatch = async (
  name: string,
  data: any,
  options: DispatchOptions = {},
) => {
  const { queue = 'default', debounce, ...jobOptions } = options

  if (config.queue.driver === 'sync') {
    return syncQueue.add(name, data, jobOptions)
  }

  if (debounce) {
    return debouncedDispatch({
      job: {
        name,
        data,
        options: jobOptions,
      },
      debounce: {
        key: debounce.key,
        id: debounce.id ?? generateUuid(),
        delaySecs: debounce.delaySecs,
      },
    })
  }

  return getQueue(queue).add(name, data, jobOptions)
}
