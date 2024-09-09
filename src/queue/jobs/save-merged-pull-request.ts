import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { saveMergedPullRequest as savePullRequest } from '@/lib/github/save-merged-pull-request'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { logger } from '@/lib/log/logger'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { checkForUnclosedTask } from '@/queue/jobs/check-for-unclosed-task'

export const saveMergedPullRequest = createJob({
  id: 'save_merged_pull_request',
  handle: async (payload: {
    pull_request: {
      user: {
        id: number
        login: string
      }
      merged_at: string | null
      body: string | null
      id: number
      title: string
      number: number
      created_at: string
      head: {
        ref: string
      }
      base: {
        repo: {
          id: number
          name: string
          full_name: string
          html_url: string
          default_branch: string
        }
        ref: string
      }
      html_url: string
    }
    installation?: {
      id: number
    }
  }) => {
    const { pull_request, installation } = payload

    logger.debug('Start save merged PR', {
      event: 'save_merged_pull_request.start',
      pull_request: getPullRequestLogData(pull_request),
    })

    const organization = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'github.organization',
        'github.organization.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'slack.workspace',
        'slack.workspace.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'homie.subscription',
        'homie.subscription.organization_id',
        'homie.organization.id',
      )
      .leftJoin('homie.plan', 'homie.plan.id', 'homie.subscription.plan_id')
      .leftJoin(
        'trello.workspace',
        'trello.workspace.organization_id',
        'homie.organization.id',
      )
      .leftJoin(
        'asana.app_user',
        'asana.app_user.organization_id',
        'homie.organization.id',
      )
      .where('ext_gh_install_id', '=', installation?.id!)
      .select([
        'homie.organization.id',
        'github.organization.ext_gh_install_id',
        'has_unlimited_usage',
        'trello_access_token',
        'asana_access_token',
        'slack_access_token',
      ])
      .executeTakeFirst()

    if (!organization) {
      logger.debug('Missing organization', {
        event: 'save_merged_pull_request.missing_organization',
        pull_request: getPullRequestLogData(pull_request),
      })
      return
    }

    if (await getIsOverPlanContributorLimit({ organization })) {
      logger.debug('org over plan contributor limit', {
        event: 'save_merged_merge_request.org_over_plan_limit',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      })
      return
    }

    const pullRequest = await savePullRequest({
      pullRequest: pull_request,
      organization,
    })

    if (pullRequest) {
      await checkForUnclosedTask.dispatch(
        {
          pull_request: {
            ...pullRequest,
            merged_at: pullRequest.merged_at?.toISOString() ?? null,
            created_at: pullRequest.created_at.toISOString(),
          },
          summary: pullRequest.summary,
        },
        {
          debounce: {
            key: `check_unclosed_task:pull_request:${pullRequest.id}`,
            delaySecs: 120,
          },
        },
      )
    }

    logger.debug('Finished saving merged PR', {
      event: 'save_merged_pull_request.complete',
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData(organization),
    })
  },
})
