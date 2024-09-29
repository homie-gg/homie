import {
  createGithubClient,
  GithubClient,
} from '@/lib/github/create-github-client'

interface GetGithubAccessTokenParams {
  github: GithubClient
}

/**
 * Returns the access token used by a GitHub app installation.
 * @param params
 */
export async function getGithubAccessToken(
  params: GetGithubAccessTokenParams,
): Promise<string> {
  const { github } = params

  const { token } = (await github.auth({ type: 'installation' })) as any

  return token
}
