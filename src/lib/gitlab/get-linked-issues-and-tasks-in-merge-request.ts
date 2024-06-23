import { findLinkedAsanaTask } from '@/lib/asana/find-linked-asana-task'
import { findLinkedTrelloTask } from '@/lib/trello/find-linked-trello-task'

interface GetLinkedIssuesAndTasksInMergeRequestParams {
  mergeRequest: {
    description: string | null
  }
  organization: {
    gitlab_access_token: string
    trello_access_token: string | null
    asana_access_token: string | null
  }
}

export async function getLinkedIssuesAndTasksInMergeRequest(
  params: GetLinkedIssuesAndTasksInMergeRequestParams,
) {
  const { mergeRequest, organization } = params

  let result = ``

  if (organization.trello_access_token) {
    const trelloTask = await findLinkedTrelloTask({
      body: mergeRequest.description,
      trelloAccessToken: organization.trello_access_token,
    })

    if (trelloTask) {
      result += `\n${trelloTask}`
    }
  }

  if (organization.asana_access_token) {
    const asanaTask = await findLinkedAsanaTask({
      body: mergeRequest.description,
      asanaAccessToken: organization.asana_access_token,
    })

    if (asanaTask) {
      result += `\n${asanaTask}`
    }
  }

  return result
}
