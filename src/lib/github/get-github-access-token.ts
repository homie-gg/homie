import { createGithubClient } from '@/lib/github/create-github-client'

interface GetGithubAccessTokenParams {
  organization: {
    ext_gh_install_id: number
  }
}

/**
 * Returns the access token used by a GitHub app installation.
 * @param params
 */
export async function getGithubAccessToken(
  params: GetGithubAccessTokenParams,
): Promise<string> {
  const { organization } = params

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const { token } = (await github.auth({ type: 'installation' })) as any

  return token
}
