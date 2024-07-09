import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

interface ListMergeRequestCommitsParams {
  gitlabAccessToken: string
  projectId: number
  mergeRequestIid: number
}

export async function listMergeRequestCommits(
  params: ListMergeRequestCommitsParams,
) {
  const { gitlabAccessToken, projectId, mergeRequestIid } = params

  const gitlab = createGitlabClient(gitlabAccessToken)
  const commits = await gitlab.MergeRequests.allCommits(
    projectId,
    mergeRequestIid,
  )

  return commits.map((commit) => ({
    author: commit.author_name,
    message: commit.message,
  }))
}
