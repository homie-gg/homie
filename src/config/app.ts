interface AppConfig {
  isProduction: boolean
  url: string
}

const environment = process.env.NEXT_PUBLIC_APP_ENV ?? 'local'

export const app: AppConfig = {
  isProduction: environment === 'production',
  url: process.env.NEXT_PUBLIC_APP_URL!,
}
