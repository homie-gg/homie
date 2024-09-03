import { config } from '@/config'

export const getUrl = (file: string) => {
  if (config.storage.driver === 's3') {
    return `${config.storage.cdnUrl}/${file}`
  }

  if (config.storage.driver === 'local') {
    return `${config.app.url}/storage/${file}`
  }

  throw new Error(`Unhandled file system driver: ${config.storage.driver}`)
}
