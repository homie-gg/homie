import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

interface GetMergeRequestDiffParams {
  gitlabAccessToken: string
  projectId: number
  mergeRequestIid: number
}

export async function getMergeRequestDiff(params: GetMergeRequestDiffParams) {
  const { gitlabAccessToken, projectId, mergeRequestIid } = params

  const gitlab = createGitlabClient(gitlabAccessToken)
  const diffs = await gitlab.MergeRequests.allDiffs(projectId, mergeRequestIid)

  return diffs.reduce((acc, i) => {
    const file = [
      `diff --git a/${i.old_path} b/${i.new_path}\n`,
      `--- a/${i.old_path}`,
      `+++ b/${i.new_path}`,
      i.diff,
    ]

    acc += `\n` + file.join('\n')

    return acc
  }, '')
}
