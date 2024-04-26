import { createGithubClient } from '@/lib/github/create-github-client'
import { findLinkedGithubIssue } from '@/lib/github/find-linked-github-issue'
import { getLinkedTrelloTask } from '@/lib/trello/find-linked-trello-task'

interface GetLinkedIssuesAndTasksParams {
  pullRequest: {
    body: string | null
    base: {
      repo: {
        name: string
        full_name: string
      }
    }
  }
  organization: {
    id: number
    ext_gh_install_id: number
    trello_access_token: string | null
  }
}

export async function getLinkedIssuesAndTasks(
  params: GetLinkedIssuesAndTasksParams,
): Promise<string> {
  const { pullRequest, organization } = params

  const owner = pullRequest.base.repo.full_name.split('/')[0]

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  let result = ``

  const githubIssue = await findLinkedGithubIssue({
    pullRequest: {
      body: pullRequest.body,
    },
    repo: pullRequest.base.repo.name,
    owner,
    github,
  })

  if (githubIssue?.body) {
    result += `\n${githubIssue.body}`
  }

  if (organization.trello_access_token) {
    const trelloTask = await getLinkedTrelloTask({
      pullRequest,
      trelloAccessToken: organization.trello_access_token,
    })

    if (trelloTask) {
      result += `\n${trelloTask}`
    }
  }

  return result
}
