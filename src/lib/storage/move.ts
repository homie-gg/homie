import { config } from '@/config'
import { getPath } from '@/lib/storage/get-path'
import fs from 'node:fs/promises'

export const move = (oldPath: string, newPath: string): Promise<void> => {
  if (config.storage.driver === 'local') {
    console.log('PATHL ', getPath(newPath))
    return fs.rename(oldPath, getPath(newPath))
  }

  throw new Error(`Unhandled driver: ${config.storage.driver}`)
}
