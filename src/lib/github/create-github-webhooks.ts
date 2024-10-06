import { createGithubApp } from '@/lib/github/create-github-app'
import { assignContributorFromGithubIssue } from '@/lib/github/assign-contributor-from-github-issue'
import { unassignContributorFromGithubIssue } from '@/lib/github/unassign-contributor-from-github-issue'
import { closeTaskFromGithubIssue } from '@/lib/github/close-task-from-github-issue'
import { deleteTaskFromGithubIssue } from '@/lib/github/delete-task-from-github-issue'
import { reopenTaskFromGithubIssue } from '@/lib/github/reopen-task-from-github-issue'
import {
  generateOpenPullRequestSummary,
  summaryKey,
} from '@/queue/jobs/generate-open-pull-request-summary'
import { createHomieTaskFromGithubIssue } from '@/queue/jobs/create-homie-task-from-github-issue'
import { updateHomieTaskFromGithubIssue } from '@/queue/jobs/update-homie-task-from-github-issue'
import { reopenPullRequest } from '@/queue/jobs/reopen-pull-request'
import { closePullRequest } from '@/queue/jobs/close-pull-requests'
import { saveOpenedPullRequest } from '@/queue/jobs/save-opened-pull-request'
import { updatePullRequestSummaryComment } from '@/queue/jobs/update-pull-request-summary-comment'

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

    await updatePullRequestSummaryComment.dispatch({
      pull_request,
      installation,
    })
  })

  app.webhooks.on('pull_request.opened', async (params) => {
    const { pull_request, installation } = params.payload

    await saveOpenedPullRequest.dispatch({
      pull_request,
      installation,
    })

    await updatePullRequestSummaryComment.dispatch({
      pull_request,
      installation,
    })
  })

  app.webhooks.on('pull_request.synchronize', async (params) => {
    const { pull_request, installation } = params.payload

    await updatePullRequestSummaryComment.dispatch({
      pull_request,
      installation,
    })
  })

  webhooks = app.webhooks

  return webhooks
}
