import { dbClient } from '@/database/client'
import { getIsOverPlanPRLimit } from '@/lib/billing/get-is-over-plan-pr-limit'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { logger } from '@/lib/log/logger'
import { SaveOpenedMergeRequest } from '@/queue/jobs'
import { parseISO } from 'date-fns'
import { getMergeRequestLogData } from '@/lib/gitlab/get-merge-request-log-data'
import { getProjectLogData } from '@/lib/gitlab/get-project-log-data'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

export async function handleSaveOpenedMergeRequest(
  job: SaveOpenedMergeRequest,
) {
  const { organization, merge_request } = job.data

  logger.debug('Start save opened PR', {
    event: 'save_opened_pull_request.start',
    data: {
      organization: getOrganizationLogData(organization),
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
      event: 'save_opened_merge_request.missing_project',
      data: {
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    logger.debug('org over plan limit', {
      event: 'save_opened_merge_request.org_over_plan_limit',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })
    return
  }

  const isOverPlanPRLimit = await getIsOverPlanPRLimit({
    organization,
    pr_limit_per_month: organization.pr_limit_per_month,
  })

  if (isOverPlanPRLimit && !organization.has_unlimited_usage) {
    await dbClient
      .updateTable('voidpm.organization')
      .set({
        is_over_plan_pr_limit: true,
      })
      .where('voidpm.organization.id', '=', organization.id)
      .executeTakeFirstOrThrow()

    logger.debug('org over plan limit', {
      event: 'save_opened_merge_request.org_over_plan_limit',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const author = await gitlab.Users.show(merge_request.author_id)

  const mergeRequestData = await gitlab.Projects.show(merge_request.id)
  if (!mergeRequestData) {
    logger.debug('missing gitlab merge request data', {
      event: 'save_opened_merge_request.missing_merge_request_data',
      data: {
        project: getProjectLogData(project),
        merge_request: getMergeRequestLogData(merge_request),
        organization: getOrganizationLogData(organization),
      },
    })

    return
  }

  if (!author) {
    logger.debug('missing gitlab user info', {
      event: 'save_opened_merge_request.missing_gitlab_user_info',
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
    .insertInto('voidpm.contributor')
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
    .insertInto('voidpm.pull_request')
    .values({
      created_at: parseISO(merge_request.created_at),
      ext_gitlab_merge_request_id: merge_request.id,
      ext_gitlab_merge_request_iid: merge_request.iid,
      number: merge_request.iid,
      organization_id: organization.id,
      contributor_id: contributor.id,
      title: merge_request.title,
      html_url: mergeRequestData.web_url,
      gitlab_project_id: project.id,
      body: merge_request.description ?? '',
      merged_at: merge_request.merged_at
        ? parseISO(merge_request.merged_at)
        : null,
    })
    .onConflict((oc) =>
      oc.column('ext_gitlab_merge_request_id').doUpdateSet({
        created_at: parseISO(merge_request.created_at),
        organization_id: organization.id,
        contributor_id: contributor.id,
        title: merge_request.title,
        html_url: mergeRequestData.web_url,
        number: merge_request.iid,
        gitlab_project_id: project.id,
        body: merge_request.description ?? '',
        merged_at: merge_request.merged_at
          ? parseISO(merge_request.merged_at)
          : null,
      }),
    )
    .returningAll()
    .executeTakeFirstOrThrow()

  logger.debug('Finished saving opened MR', {
    event: 'save_opened_merge_request.complete',
    data: {
      project: getProjectLogData(project),
      merge_request: getMergeRequestLogData(merge_request),
      organization: getOrganizationLogData(organization),
    },
  })
}
