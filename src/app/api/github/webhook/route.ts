import { NextRequest, NextResponse } from 'next/server'
import { dispatch } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { logger } from '@/lib/log/logger'
import { createGithubApp } from '@/lib/github/create-github-app'
import { dbClient } from '@/database/client'
import { assignContributorFromGithubIssue } from '@/lib/github/assign-contributor-from-github-issue'
import { unassignContributorFromGithubIssue } from '@/lib/github/unassign-contributor-from-github-issue'
import { closeTaskFromGithubIssue } from '@/lib/github/close-task-from-github-issue'
import { deleteTaskFromGithubIssue } from '@/lib/github/delete-task-from-github-issue'
import { reopenTaskFromGithubIssue } from '@/lib/github/reopen-task-from-github-issue'

export const POST = async (request: NextRequest) => {
  logger.debug('Received Github webhook', {
    event: 'github.webhook.received',
    data: JSON.stringify(await request.clone().json()),
  })

  const app = createGithubApp()

  // ✅ opened - create task
  // ✅ assigned - add assignment
  // ✅ unassigned - remove assignment
  // ✅ closed - mark task done
  // ✅ deleted - delete task
  // ✅ edited - update task descriptiong / name
  // ✅  re-opened - mark task as open again

  app.webhooks.on('issues.opened', async (params) => {
    const {
      payload: { issue, installation },
    } = params

    await dispatch('create_task_from_github_issue', {
      issue,
      installation,
    })
  })

  app.webhooks.on('issues.assigned', async (params) => {
    await assignContributorFromGithubIssue(params.payload)
  })

  app.webhooks.on('issues.unassigned', async (params) => {
    await unassignContributorFromGithubIssue(params.payload)
  })

  app.webhooks.on('issues.closed', async (params) => {
    await closeTaskFromGithubIssue(params.payload)
  })

  app.webhooks.on('issues.deleted', async (params) => {
    await deleteTaskFromGithubIssue(params.payload)
  })

  app.webhooks.on('issues.edited', async (params) => {
    const {
      payload: { issue, installation },
    } = params

    await dispatch('update_task_from_github_issue', {
      issue,
      installation,
    })
  })

  app.webhooks.on('issues.reopened', async (params) => {
    await reopenTaskFromGithubIssue(params.payload)
  })

  app.webhooks.on('pull_request.closed', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    await dispatch('save_merged_pull_request', {
      pull_request,
      installation,
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
      return
    }

    await dispatch('close_linked_tasks', {
      pullRequestBody: pull_request.body ?? '',
      organization,
    })
  })

  app.webhooks.on('pull_request.edited', async (params) => {
    const { pull_request, installation } = params.payload

    if (pull_request.body?.includes(summaryKey)) {
      await dispatch('generate_open_pull_request_summary', {
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.on('pull_request.opened', async (params) => {
    const { pull_request, installation } = params.payload

    await dispatch('save_opened_pull_request', {
      pull_request,
      installation,
    })

    if (pull_request.body?.includes(summaryKey)) {
      await dispatch('generate_open_pull_request_summary', {
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.verifyAndReceive({
    id: request.headers.get('x-request-id')!,
    name: request.headers.get('x-github-event') as any,
    signature: request.headers.get('x-hub-signature')!,
    payload: await request.text(),
  })

  return NextResponse.json({})
}
