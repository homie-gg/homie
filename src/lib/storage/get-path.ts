import { config } from '@/config'

export const getPath = (file: string) => {
  if (config.storage.driver === 'local') {
    const appRoot = __dirname.includes('.next')
      ? __dirname.split('/.next')[0]
      : '/app'
    return `${appRoot}/storage/${file}`
  }

  throw new Error(`Unhandled file system driver: ${config.storage.driver}`)
}
