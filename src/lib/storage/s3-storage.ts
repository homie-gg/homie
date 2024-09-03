import { config } from '@/config'
import { Storage } from '@/lib/storage/types'

export const s3: Storage = {
  getUrl: function (file: string): string {
    return `${config.storage.cdnUrl}/${file}`
  },
  getPath: function (file: string): string {
    throw new Error('Function not implemented.')
  },
  move: function (oldPath: string, newPath: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
  put: function (file: string, contents: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
  deleteDirectory: function (directory: string): Promise<boolean> {
    throw new Error('Function not implemented.')
  },
  delete: function (file: string): Promise<void> {
    throw new Error('Function not implemented.')
  },
}
