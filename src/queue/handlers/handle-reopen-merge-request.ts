import { dbClient } from '@/database/client'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { getProjectLogData } from '@/lib/gitlab/get-project-log-data'
import { logger } from '@/lib/log/logger'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { ReopenMergeRequest } from '@/queue/jobs'

export async function handleReopenMergeRequest(job: ReopenMergeRequest) {
  const { merge_request, organization } = job.data

  logger.debug('Reopen merge request', {
    event: 'reopen_merge_Request:start',
    data: {
      merge_request: getMergeRequestLogData(merge_request),
    },
  })

  const project = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .where('ext_gitlab_project_id', '=', merge_request.target_project_id)
    .where('enabled', '=', true)
    .select(['id', 'name', 'ext_gitlab_project_id', 'enabled'])
    .executeTakeFirst()

  if (!project) {
    logger.debug('Missing project; is the project enabled?', {
      event: 'reopen_merge_Request.missing_project',
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  if (await getIsOverPlanContributorLimit({ organization })) {
    logger.debug('org over plan contributor limit', {
      event: 'reopen_merge_Request.org_over_plan_limit',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const pullRequest = await dbClient
    .selectFrom('homie.pull_request')
    .where('ext_gitlab_merge_request_id', '=', merge_request.id)
    .select(['id'])
    .executeTakeFirst()

  if (pullRequest) {
    await dbClient
      .updateTable('homie.pull_request')
      .where('id', '=', pullRequest.id)
      .set({
        closed_at: null,
      })
      .executeTakeFirstOrThrow()

    logger.debug('Reopen existing merge request', {
      event: 'reopen_merge_Request:reopened_existing_mr',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  const mergeRequestInfo = await gitlab.MergeRequests.show(
    project.ext_gitlab_project_id,
    merge_request.iid,
  )

  if (!mergeRequestInfo) {
    logger.debug('missing gitlab merge request data', {
      event: 'reopen_merge_Request:missing_merge_request_data',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  const author = await gitlab.Users.show(merge_request.author_id)

  if (!author) {
    logger.debug('missing gitlab user info', {
      event: 'reopen_merge_Request:missing_gitlab_user_info',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  // Create contributor
  const contributor = await dbClient
    .insertInto('homie.contributor')
    .values({
      ext_gitlab_author_id: author.id,
      organization_id: organization.id,
      username: author.username,
    })
    .onConflict((oc) =>
      oc.column('ext_gitlab_author_id').doUpdateSet({
        organization_id: organization.id,
        username: author.username,
      }),
    )
    .returning('id')
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('homie.pull_request')
    .values({
      ext_gitlab_merge_request_id: merge_request.id,
      ext_gitlab_merge_request_iid: merge_request.iid,
      number: merge_request.iid,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: merge_request.title,
      html_url: mergeRequestInfo.web_url,
      gitlab_project_id: project.id,
      body: merge_request.description ?? '',
      source_branch: mergeRequestInfo.source_branch,
      target_branch: mergeRequestInfo.target_branch,
    })
    .onConflict((oc) =>
      oc.column('ext_gitlab_merge_request_id').doUpdateSet({
        organization_id: organization.id,
        contributor_id: contributor.id,
        title: merge_request.title,
        html_url: mergeRequestInfo.web_url,
        number: merge_request.iid,
        gitlab_project_id: project.id,
        body: merge_request.description ?? '',
        source_branch: mergeRequestInfo.source_branch,
        target_branch: mergeRequestInfo.target_branch,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  logger.debug('Saved untracked reopened MR', {
    event: 'reopen_merge_Request:save_untracked_pr',
    data: {
      project: getProjectLogData(project),
      merge_request: getMergeRequestLogData(merge_request),
      organization: getOrganizationLogData(organization),
    },
  })
}
