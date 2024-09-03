import { config } from '@/config'
import { Storage } from '@/lib/storage/types'
import fs from 'node:fs/promises'
import fsSync from 'node:fs'
import { rimraf } from 'rimraf'

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
    const path = localStorage.getPath(file)

    // Recursively create directories as needed
    const folders = path.split('/').slice(0, -1) // remove the target file
    folders.reduce((acc, folder) => {
      const currentPath = acc + folder + '/'
      if (!fsSync.existsSync(currentPath)) {
        fsSync.mkdirSync(currentPath)
      }
      return currentPath
    }, '/')

    return fs.writeFile(localStorage.getPath(file), contents)
  },
  delete: function (file: string): Promise<void> {
    return fs.rm(localStorage.getPath(file))
  },
  deleteDirectory: function (directory: string): Promise<boolean> {
    return rimraf(localStorage.getPath(directory))
  },
}
