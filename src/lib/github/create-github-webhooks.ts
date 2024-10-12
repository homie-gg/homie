import { createGithubApp } from '@/lib/github/create-github-app'
import { assignContributorFromGithubIssue } from '@/lib/github/assign-contributor-from-github-issue'
import { unassignContributorFromGithubIssue } from '@/lib/github/unassign-contributor-from-github-issue'
import { closeTaskFromGithubIssue } from '@/lib/github/close-task-from-github-issue'
import { deleteTaskFromGithubIssue } from '@/lib/github/delete-task-from-github-issue'
import { reopenTaskFromGithubIssue } from '@/lib/github/reopen-task-from-github-issue'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { createGithubClient } from '@/lib/github/create-github-client'
import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import {
  generateOpenPullRequestSummary,
  summaryKey,
} from '@/queue/jobs/generate-open-pull-request-summary'
import { createHomieTaskFromGithubIssue } from '@/queue/jobs/create-homie-task-from-github-issue'
import { updateHomieTaskFromGithubIssue } from '@/queue/jobs/update-homie-task-from-github-issue'
import { reopenPullRequest } from '@/queue/jobs/reopen-pull-request'
import { closePullRequest } from '@/queue/jobs/close-pull-requests'
import { saveOpenedPullRequest } from '@/queue/jobs/save-opened-pull-request'

let webhooks: ReturnType<typeof createGithubApp>['webhooks'] | null = null

export const getGithubWebhooks = () => {
  if (webhooks) {
    return webhooks
  }

  const app = createGithubApp()

  app.webhooks.on('issues.opened', async (params) => {
    const {
      payload: { issue, installation, repository },
    } = params

    await createHomieTaskFromGithubIssue.dispatch({
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

    await updateHomieTaskFromGithubIssue.dispatch({
      issue,
      installation,
      repository,
    })
  })

  app.webhooks.on('issues.reopened', async (params) => {
    await reopenTaskFromGithubIssue(params.payload)
  })

  app.webhooks.on('pull_request.reopened', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    await reopenPullRequest.dispatch({
      pull_request,
      installation,
    })
  })

  app.webhooks.on('pull_request.closed', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    await closePullRequest.dispatch({
      pull_request,
      installation,
    })
  })

  app.webhooks.on('pull_request.edited', async (params) => {
    const { pull_request, installation } = params.payload

    if (pull_request.body?.includes(summaryKey)) {
      await generateOpenPullRequestSummary.dispatch({
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.on('pull_request.opened', async (params) => {
    const { pull_request, installation } = params.payload

    await saveOpenedPullRequest.dispatch({
      pull_request,
      installation,
    })

    if (pull_request.body?.includes(summaryKey)) {
      await generateOpenPullRequestSummary.dispatch({
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.on('pull_request_review_comment.created', async (params) => {
    const { payload } = params
    const { comment, repository, installation, pull_request } = payload

    if (!comment.body.includes('@homie')) {
      return
    }

    try {
      const organization = await dbClient
        .selectFrom('homie.organization')
        .where('ext_gh_install_id', '=', installation.id)
        .select([
          'id',
          'ext_gh_install_id',
          'is_persona_enabled',
          'persona_positivity_level',
          'persona_g_level',
          'persona_affection_level',
          'persona_emoji_level',
        ])
        .executeTakeFirst()

      if (!organization) {
        logger.error('Organization not found for GitHub installation', {
          installation_id: installation.id,
        })
        return
      }

      const message = comment.body.replace('@homie', '').trim()
      const answer = await getAnswer({
        organization,
        messages: [
          { type: 'human', text: message, ts: new Date().toISOString() },
        ],
        channelID: `github-${repository.id}`,
      })

      const github = await createGithubClient({
        installationId: organization.ext_gh_install_id,
      })

      await github.rest.pulls.createReviewComment({
        owner: repository.owner.login,
        repo: repository.name,
        pull_number: pull_request.number,
        body: answer,
        commit_id: comment.commit_id,
        path: comment.path,
        line: comment.line,
      })
    } catch (error) {
      logger.error('Error processing GitHub review comment webhook', {
        error: error instanceof Error ? error.message : 'Unknown error',
      })
    }
  })

  webhooks = app.webhooks

  return webhooks
}
