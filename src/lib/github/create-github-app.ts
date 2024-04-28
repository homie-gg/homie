import { getPrivateKey } from '@/lib/github/create-github-client'
import { App } from 'octokit'

let app: App | null

export function createGithubApp() {
  if (app) {
    return app
  }

  app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: getPrivateKey().toString('utf-8'),
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET!,
    },
  })

  return app
}
