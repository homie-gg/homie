import { dispatch, DispatchOptions } from '@/queue/dispatch'
import { Job as BullMQJob } from 'bullmq'

export type Job<TData = any, JReturnData = any> = {
  id: string
  handle: (payload: TData) => Promise<JReturnData>
  dispatch: (
    payload: TData,
    options?: DispatchOptions,
  ) => Promise<void | BullMQJob<any, any, string>>
}

export function createJob<TData, JReturnData>(params: {
  id: string
  handle: (payload: TData) => Promise<JReturnData>
}): Job<TData, JReturnData> {
  return {
    id: params.id,
    handle: params.handle,
    dispatch: async (payload: TData, options?: DispatchOptions) =>
      dispatch(params.id as any, payload as any, options),
  }
}
