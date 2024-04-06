import crypto from 'node:crypto'
import { App } from 'octokit'

interface CreateGithubClientParams {
  installationId: number
}

let privateKey: string | Buffer | null = null

export const getPrivateKey = () => {
  if (privateKey) {
    return privateKey
  }
  privateKey = crypto
    .createPrivateKey(atob(process.env.GITHUB_PRIVATE_KEY!))
    .export({
      type: 'pkcs8',
      format: 'pem',
    })

  return privateKey
}

export type GithubClient = Awaited<ReturnType<typeof createGithubClient>>

export async function createGithubClient(params: CreateGithubClientParams) {
  const { installationId } = params

  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: getPrivateKey().toString('utf-8'),
  })

  return app.getInstallationOctokit(installationId)
}
