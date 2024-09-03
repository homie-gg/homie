import { config } from '@/config'
import { Storage } from '@/lib/storage/types'
import fs from 'node:fs/promises'

export const localStorage: Storage = {
  getUrl: function (file: string): string {
    return `${config.app.url}/storage/${file}`
  },
  getPath: function (file: string): string {
    const appRoot = __dirname.includes('.next')
      ? __dirname.split('/.next')[0]
      : '/app'
    return `${appRoot}/storage/${file}`
  },
  move: function (oldPath: string, newPath: string): Promise<void> {
    return fs.rename(oldPath, localStorage.getPath(newPath))
  },
  put: function (file: string, contents: string): Promise<void> {
    return fs.writeFile(localStorage.getPath(file), contents)
  },
}
