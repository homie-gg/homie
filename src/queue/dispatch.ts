import { GetDataType, getQueue } from '@/queue/get-queue'
import { Job } from '@/queue/jobs'
import { JobsOptions } from 'bullmq'

export interface DispatchOptions extends JobsOptions {
  queue?: string
}

export const dispatch = async <TJob extends Job, Name extends TJob['name']>(
  name: Name,
  data: GetDataType<TJob, Name>,
  options: DispatchOptions = {},
) => {
  const { queue = 'default' } = options

  return getQueue(queue).add(name, data, options)
}
