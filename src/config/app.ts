interface AppConfig {
  isProduction: boolean
}

const environment = process.env.APP_ENV ?? 'local'

export const app: AppConfig = {
  isProduction: environment === 'production',
}
