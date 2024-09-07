import { app } from '@/config/app'
import { aws } from '@/config/aws'
import { queue } from '@/config/queue'
import { storage } from '@/config/storage'

export const config = {
  app,
  queue,
  storage,
  aws,
}
