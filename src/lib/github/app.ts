import { privateKey } from '@/lib/github/create-github-client'
import { App } from 'octokit'

export const app = new App({
  appId: process.env.GITHUB_APP_ID!,
  privateKey: privateKey.toString('utf-8'),
  webhooks: {
    secret: process.env.GITHUB_WEBHOOK_SECRET!,
  },
})
