import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { removeGitlabWebhooks } from '@/lib/gitlab/remove-gitlab-webhooks'

const gitlabWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/gitlab/webhook`

interface RegisterGitlabWebhooksParams {
  gitlabAppUser: {
    gitlab_access_token: string
    gitlab_webhook_secret: string
  }
  project: {
    ext_gitlab_project_id: number
  }
}

export async function registerGitlabWebhooks(
  params: RegisterGitlabWebhooksParams,
) {
  const { gitlabAppUser, project } = params

  await removeGitlabWebhooks({
    project,
    gitlabAppUser,
  })

  const gitlab = createGitlabClient(gitlabAppUser.gitlab_access_token)

  await gitlab.ProjectHooks.add(
    project.ext_gitlab_project_id,
    gitlabWebhookUrl,
    {
      pushEvents: false,
      mergeRequestsEvents: true,
      token: gitlabAppUser.gitlab_webhook_secret,
    },
  )
}
