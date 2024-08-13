interface AppConfig {
  isProduction: boolean
}

const environment = process.env.NEXT_PUBLIC_APP_ENV ?? 'local'

export const app: AppConfig = {
  isProduction: environment === 'production',
}
