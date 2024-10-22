import { handleGithubPROpened } from './create-github-webhooks'
import { handleGitlabPROpened } from './gitlab/webhook/route'

export async function handlePROpened(
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token: string | null
  },
  prData: any,
  source: 'github' | 'gitlab',
) {
  if (source === 'github' && organization.ext_gh_install_id) {
    await handleGithubPROpened({
      id: organization.id,
      ext_gh_install_id: organization.ext_gh_install_id,
    }, prData)
  } else if (source === 'gitlab' && organization.gitlab_access_token) {
    await handleGitlabPROpened({
      id: organization.id,
      gitlab_access_token: organization.gitlab_access_token,
    }, prData)
  }
}
