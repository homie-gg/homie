import { dbClient } from '@/database/client'
import { embedCodeChange } from '@/lib/ai/embed-code-change'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { embedGitlabDiff } from '@/lib/gitlab/embed-gitlab-diff'
import { getLinkedIssuesAndTasksInMergeRequest } from '@/lib/gitlab/get-linked-issues-and-tasks-in-merge-request'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { summarizeGitlabMergeRequest } from '@/lib/gitlab/summarize-gitlab-merge-request'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { logger } from '@/lib/log/logger'
import { parseISO } from 'date-fns'

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
  }
  project: {
    id: number
    ext_gitlab_project_id: number
  }
  organization: {
    id: number
    gitlab_access_token: string
    trello_access_token: string | null
  }
}

export async function saveMergedMergeRequest(
  params: SaveMergedMergeRequestParams,
) {
  const { organization, mergeRequest, project } = params

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

  const { summary, diff } = await summarizeGitlabMergeRequest({
    mergeRequest,
    length: 'long',
    issue,
    gitlab,
    project,
  })

  const embed_metadata = {
    type: 'mr_summary',
    title: mergeRequest.title,
    url: mergeRequest.web_url,
    ext_gitlab_merge_request_id: mergeRequest.id,
    organization_id: organization.id,
    contributor_id: contributor.id,
    project: project.id,
    merged_at: mergeRequest.merged_at,
  }

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
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  await embedCodeChange({
    label: 'Merge Request',
    title: pullRequestRecord.title,
    url: pullRequestRecord.html_url,
    summary,
    metadata: embed_metadata,
    contributor: mergeRequest.author.username,
    mergedAt: pullRequestRecord.merged_at,
  })

  if (diff) {
    await embedGitlabDiff({
      pullRequest: pullRequestRecord,
      diff,
      summary,
      contributor: mergeRequest.author.username,
      organization_id: organization.id,
    })
  }
}