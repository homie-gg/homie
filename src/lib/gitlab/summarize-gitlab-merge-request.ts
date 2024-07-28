import { summarizeCodeChange } from '@/lib/ai/summarize-code-change'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { Gitlab } from '@gitbeaker/core'

interface SummarizeGitlabMergeRequestParams {
  gitlab: Gitlab
  project: {
    ext_gitlab_project_id: number
  }
  mergeRequest: {
    title: string
    id: number
    iid: number
    description: string | null
  }
  length: 'short' | 'long'
  issue: string | null
  conversation: string | null
}

export async function summarizeGitlabMergeRequest(
  params: SummarizeGitlabMergeRequestParams,
) {
  const { gitlab, project, mergeRequest, length, issue, conversation } = params

  const diffs = await gitlab.MergeRequests.allDiffs(
    project.ext_gitlab_project_id,
    mergeRequest.iid,
  )

  const diffString = diffs.reduce((acc, i) => {
    const file = [
      `diff --git a/${i.old_path} b/${i.new_path}\n`,
      `--- a/${i.old_path}`,
      `+++ b/${i.new_path}`,
      i.diff,
    ]

    acc += `\n` + file.join('\n')

    return acc
  }, '')

  const summary = await summarizeCodeChange({
    title: mergeRequest.title,
    diff: diffString,
    issue,
    body: mergeRequest.description?.replaceAll(summaryKey, '') ?? '',
    length: length,
    conversation,
  })

  return {
    summary,
    diff: diffString,
  }
}
