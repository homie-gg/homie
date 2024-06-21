import { dispatch } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { createGithubApp } from '@/lib/github/create-github-app'
import { dbClient } from '@/database/client'
import { assignContributorFromGithubIssue } from '@/lib/github/assign-contributor-from-github-issue'
import { unassignContributorFromGithubIssue } from '@/lib/github/unassign-contributor-from-github-issue'
import { closeTaskFromGithubIssue } from '@/lib/github/close-task-from-github-issue'
import { deleteTaskFromGithubIssue } from '@/lib/github/delete-task-from-github-issue'
import { reopenTaskFromGithubIssue } from '@/lib/github/reopen-task-from-github-issue'

let webhooks: ReturnType<typeof createGithubApp>['webhooks'] | null = null

export const createGithubWebhooks = () => {
  if (webhooks) {
    return webhooks
  }

  const app = createGithubApp()

  app.webhooks.on('issues.opened', async (params) => {
    const {
      payload: { issue, installation, repository },
    } = params

    await dispatch('create_homie_task_from_github_issue', {
      issue,
      repository,
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
      payload: { issue, installation, repository },
    } = params

    await dispatch('update_homie_task_from_github_issue', {
      issue,
      installation,
      repository,
    })
  })

  app.webhooks.on('issues.reopened', async (params) => {
    await reopenTaskFromGithubIssue(params.payload)
  })

  app.webhooks.on('pull_request.closed', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    if (!pull_request.merged_at) {
      return
    }

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

  webhooks = app.webhooks

  return webhooks
}
