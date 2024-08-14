import { dbClient } from '@/database/client'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getLinkedIssuesAndTasksInMergeRequest } from '@/lib/gitlab/get-linked-issues-and-tasks-in-merge-request'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { summarizeGitlabMergeRequest } from '@/lib/gitlab/summarize-gitlab-merge-request'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { logger } from '@/lib/log/logger'
import { parseISO } from 'date-fns'
import { getReferencedSlackMessages } from '@/lib/slack/get-referenced-slack-messages'
import { embedPullRequestChanges } from '@/lib/ai/embed-pull-request-changes'
import { embedPullRequestDiff } from '@/lib/ai/embed-pull-request-diff'
import { calculatePullRequestComplexity } from '@/lib/ai/calculate-pull-request-complexity'

interface SaveMergedMergeRequestParams {
  mergeRequest: {
    id: number
    iid: number
    created_at: string
    title: string
    web_url: string
    merged_at: string | null
    closed_at: string | null
    description: string | null
    author: {
      id: number
      username: string
    }
    target_branch: string
    source_branch: string
  }
  project: {
    id: number
    ext_gitlab_project_id: number
  }
  organization: {
    id: number
    gitlab_access_token: string
    trello_access_token: string | null
    asana_access_token: string | null
    slack_access_token: string | null
  }
  defaultBranch: string
}

export async function saveMergedMergeRequest(
  params: SaveMergedMergeRequestParams,
) {
  const { organization, mergeRequest, project, defaultBranch } = params

  logger.debug('Start Save merge request', {
    event: 'save_merge_request.start',
    data: {
      organization: getOrganizationLogData(organization),
      merge_request: getMergeRequestLogData(mergeRequest),
    },
  })

  // Create contributor
  const contributor = await dbClient
    .insertInto('homie.contributor')
    .values({
      ext_gitlab_author_id: mergeRequest.author.id,
      organization_id: organization.id,
      username: mergeRequest.author.username,
    })
    .onConflict((oc) =>
      oc.column('ext_gitlab_author_id').doUpdateSet({
        organization_id: organization.id,
        username: mergeRequest.author.username,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  const issue = await getLinkedIssuesAndTasksInMergeRequest({
    mergeRequest,
    organization,
  })

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const conversation = organization.slack_access_token
    ? await getReferencedSlackMessages({
        pullRequestBody: mergeRequest.description,
        organization: {
          id: organization.id,
          slack_access_token: organization.slack_access_token,
        },
      })
    : null

  const { summary, diff } = await summarizeGitlabMergeRequest({
    mergeRequest,
    length: 'long',
    issue,
    gitlab,
    project,
    conversation,
  })

  const complexityScoreResult = diff
    ? await calculatePullRequestComplexity({ diff })
    : null

  if (complexityScoreResult) {
    logger.debug('Calculated complexity score', {
      event: 'save_merge_request.calculated_complexity_score',
      organization: getOrganizationLogData(organization),
      ai_call: true,
      merge_request: getMergeRequestLogData(mergeRequest),
      prompt: complexityScoreResult.prompt,
      complexity_score: complexityScoreResult.score,
      failed: Boolean(complexityScoreResult.error),
      error: complexityScoreResult.error,
    })
  }

  const wasMergedToDefaultBranch = mergeRequest.target_branch === defaultBranch

  const pullRequestRecord = await dbClient
    .insertInto('homie.pull_request')
    .values({
      created_at: parseISO(mergeRequest.created_at),
      ext_gitlab_merge_request_id: mergeRequest.id,
      ext_gitlab_merge_request_iid: mergeRequest.iid,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: mergeRequest.title,
      html_url: mergeRequest.web_url,
      gitlab_project_id: project.id,
      body: mergeRequest.description ?? '',
      number: mergeRequest.iid,
      merged_at: mergeRequest.merged_at
        ? parseISO(mergeRequest.merged_at)
        : null,
      target_branch: mergeRequest.target_branch,
      source_branch: mergeRequest.source_branch,
      was_merged_to_default_branch: wasMergedToDefaultBranch,
      complexity_score: complexityScoreResult?.score,
    })
    .onConflict((oc) =>
      oc.column('ext_gitlab_merge_request_id').doUpdateSet({
        created_at: parseISO(mergeRequest.created_at),
        organization_id: organization.id,
        contributor_id: contributor.id,
        title: mergeRequest.title,
        html_url: mergeRequest.web_url,
        gitlab_project_id: project.id,
        body: mergeRequest.description ?? '',
        number: mergeRequest.iid,
        merged_at: mergeRequest.merged_at
          ? parseISO(mergeRequest.merged_at)
          : null,
        target_branch: mergeRequest.target_branch,
        source_branch: mergeRequest.source_branch,
        was_merged_to_default_branch: wasMergedToDefaultBranch,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  if (!wasMergedToDefaultBranch) {
    return
  }

  await embedPullRequestChanges({
    pullRequest: pullRequestRecord,
    summary,
    wasMergedToDefaultBranch,
  })

  if (diff) {
    await embedPullRequestDiff({
      diff,
      summary,
      pullRequest: pullRequestRecord,
    })
  }

  return {
    ...pullRequestRecord,
    summary,
  }
}
