import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { parseISO } from 'date-fns'
import { saveMergedPullRequest } from '@/queue/jobs/save-merged-pull-request'
import { closeLinkedTasks } from '@/queue/jobs/close-linked-tasks'

export const closePullRequest = createJob({
  id: 'close_pull_request',
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

    logger.debug('Handle close pull request', {
      event: 'handle_close_pull_request:start',
    })

    const organization = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'github.organization',
        'github.organization.organization_id',
        'homie.organization.id',
      )
      .where('ext_gh_install_id', '=', installation?.id!)
      .select(['homie.organization.id'])
      .executeTakeFirst()

    if (!organization) {
      logger.debug('Missing organization', {
        event: 'handle_close_pull_request:start',
        pull_request: getPullRequestLogData(pull_request),
      })
      return
    }

    if (await getIsOverPlanContributorLimit({ organization })) {
      logger.debug('org over plan limit', {
        event: 'handle_close_pull_request:org_over_plan_limit',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      })
      return
    }

    const pullRequest = await dbClient
      .selectFrom('homie.pull_request')
      .where('ext_gh_pull_request_id', '=', pull_request.id)
      .select(['id', 'closed_at'])
      .executeTakeFirst()

    if (!pull_request.merged_at && pullRequest) {
      await dbClient
        .updateTable('homie.pull_request')
        .where('id', '=', pullRequest.id)
        .set({
          closed_at: new Date(),
        })
        .executeTakeFirstOrThrow()

      logger.debug('Closed existing pr', {
        event: 'handle_close_pull_request:closed_existing_pr',
        pull_request: getPullRequestLogData(pull_request),
      })
      return
    }

    // Save any closed PRs we're not tracking
    if (!pull_request.merged_at && !pullRequest) {
      // Create Github User if doesn't exits
      const contributor = await dbClient
        .insertInto('homie.contributor')
        .values({
          ext_gh_user_id: pull_request.user.id,
          organization_id: organization.id,
          username: pull_request.user.login ?? '',
        })
        .onConflict((oc) =>
          oc.column('ext_gh_user_id').doUpdateSet({
            organization_id: organization.id,
            username: pull_request.user?.login ?? '',
          }),
        )
        .returning('id')
        .executeTakeFirstOrThrow()

      const owner = pull_request.base.repo.full_name.split('/')[0]

      const repo = await dbClient
        .insertInto('github.repo')
        .values({
          organization_id: organization.id,
          owner,
          name: pull_request.base.repo.name,
          html_url: pull_request.base.repo.html_url,
          ext_gh_repo_id: pull_request.base.repo.id,
        })
        .onConflict((oc) =>
          oc.column('ext_gh_repo_id').doUpdateSet({
            organization_id: organization.id,
            name: pull_request.base.repo.name,
            owner,
            html_url: pull_request.base.repo.html_url,
          }),
        )
        .returning('id')
        .executeTakeFirstOrThrow()

      await dbClient
        .insertInto('homie.pull_request')
        .values({
          created_at: parseISO(pull_request.created_at),
          ext_gh_pull_request_id: pull_request.id,
          organization_id: organization.id,
          contributor_id: contributor.id,
          title: pull_request.title,
          html_url: pull_request.html_url,
          github_repo_id: repo.id,
          body: pull_request.body ?? '',
          number: pull_request.number,
          closed_at: new Date(),
          target_branch: pull_request.base.ref,
          source_branch: pull_request.head.ref,
        })
        .returningAll()
        .executeTakeFirstOrThrow()

      logger.debug('Saved untracked closed PR', {
        event: 'handle_close_pull_request:save_untracked_pr',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      })

      return
    }

    await saveMergedPullRequest.dispatch({
      pull_request,
      installation,
    })

    await closeLinkedTasks.dispatch({
      pull_request: {
        body: pull_request.body ?? '',
        title: pull_request.title,
        html_url: pull_request.html_url,
      },
      organization,
    })
  },
})
