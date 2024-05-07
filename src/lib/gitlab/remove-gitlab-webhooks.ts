import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

const gitlabWebhookUrl = `${process.env.NEXT_PUBLIC_APP_URL}/api/gitlab/webhook`

interface RemoveGitlabWebhooksParams {
  gitlabAppUser: {
    gitlab_access_token: string
  }
  project: {
    ext_gitlab_project_id: number
  }
}

export async function removeGitlabWebhooks(params: RemoveGitlabWebhooksParams) {
  const { gitlabAppUser, project } = params

  const gitlab = createGitlabClient(gitlabAppUser.gitlab_access_token)

  const hooks = await gitlab.ProjectHooks.all(project.ext_gitlab_project_id)
  // Remove any previous webhooks
  for (const hook of hooks) {
    if (hook.url === gitlabWebhookUrl) {
      await gitlab.ProjectHooks.remove(project.ext_gitlab_project_id, hook.id)
    }
  }
}
