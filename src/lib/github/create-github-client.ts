import crypto from 'node:crypto'
import { App } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'

interface CreateGithubClientParams {
  installationId: number
}

export const privateKey = crypto
  .createPrivateKey(atob(process.env.GITHUB_PRIVATE_KEY!))
  .export({
    type: 'pkcs8',
    format: 'pem',
  })

export type GithubClient = Awaited<ReturnType<typeof createGithubClient>>

export async function createGithubClient(params: CreateGithubClientParams) {
  const { installationId } = params

  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: privateKey.toString('utf-8'),
  })

  return app.getInstallationOctokit(installationId)
}
