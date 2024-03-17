import crypto from 'node:crypto'
import { Octokit } from 'octokit'
import { createAppAuth } from '@octokit/auth-app'

interface CreateGithubClientParams {
  installationId: string
}

export const privateKey = crypto
  .createPrivateKey(atob(process.env.GITHUB_PRIVATE_KEY!))
  .export({
    type: 'pkcs8',
    format: 'pem',
  })

export function createGithubClient(params: CreateGithubClientParams) {
  const { installationId } = params

  return new Octokit({
    authStrategy: createAppAuth,
    auth: {
      installationId,
      appId: process.env.GITHUB_APP_ID!,
      privateKey: privateKey,
    },
  })
}
