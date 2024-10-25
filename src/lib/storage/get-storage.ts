import { config } from '@/config'
import { StorageConfig } from '@/config/storage'
import { localStorage } from '@/lib/storage/local-storage'
import { s3 } from '@/lib/storage/s3-storage'
import { Storage } from '@/lib/storage/types'

interface GetStorageParams {
  driver?: StorageConfig['driver']
}

export const getStorage = (params: GetStorageParams = {}): Storage => {
  switch (params.driver ?? config.storage.driver) {
    case 'local':
      return localStorage
    case 's3':
      return s3
    default:
      throw new Error(`Missing storage driver: ${config.storage.driver}`)
  }
}
