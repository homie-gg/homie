import { getLinkedTrelloTask } from '@/lib/trello/find-linked-trello-task'

interface GetLinkedIssuesAndTasksInMergeRequestParams {
  mergeRequest: {
    description: string | null
  }
  organization: {
    gitlab_access_token: string
    trello_access_token: string | null
  }
}

export async function getLinkedIssuesAndTasksInMergeRequest(
  params: GetLinkedIssuesAndTasksInMergeRequestParams,
) {
  const { mergeRequest, organization } = params

  let result = ``

  if (organization.trello_access_token) {
    const trelloTask = await getLinkedTrelloTask({
      body: mergeRequest.description,
      trelloAccessToken: organization.trello_access_token,
    })

    if (trelloTask) {
      result += `\n${trelloTask}`
    }
  }

  return result
}
