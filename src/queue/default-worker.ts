import { defaultQueueName } from '@/queue/default-queue'
import { handleAnswerSlackQuestion } from '@/queue/handlers/handle-answer-slack-question'
import { handleAskSlackSelectGithubRepoForIssue } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'
import { handleCreateGithubIssueFromSlack } from '@/queue/handlers/handle-create-github-issue-from-slack'
import { handleGenerateOpenPullRequestSummary } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { handleImportPullRequests } from '@/queue/handlers/handle-import-pull-requests'
import { handleSaveMergedPullRequest } from '@/queue/handlers/handle-save-merged-pull-request'
import { handleSaveOpenedPullRequest } from '@/queue/handlers/handle-save-opened-pull-request'
import { handleResetOrganizationsOverPRLimit } from '@/queue/handlers/handle-reset-organizations-over-pr-limit'
import { Job } from '@/queue/jobs'
import { Worker } from 'bullmq'
import Redis from 'ioredis'
import { handleSendPullRequestSummaries } from '@/queue/handlers/handle-send-pull-request-summaries'
import { handleSendPullRequestSummariesToOrganization } from '@/queue/handlers/handle-send-pull-request-summaries-to-organization'
import { logger } from '@/lib/log/logger'

let defaultWorker: Worker | null = null

const handlers: Handlers = {
  create_github_issue_from_slack: handleCreateGithubIssueFromSlack,
  ask_slack_select_github_repo_for_issue:
    handleAskSlackSelectGithubRepoForIssue,
  import_pull_requests: handleImportPullRequests,
  save_opened_pull_request: handleSaveOpenedPullRequest,
  save_merged_pull_request: handleSaveMergedPullRequest,
  generate_open_pull_request_summary: handleGenerateOpenPullRequestSummary,
  answer_slack_question: handleAnswerSlackQuestion,
  reset_organizations_over_pr_limit: handleResetOrganizationsOverPRLimit,
  send_pull_request_summaries: handleSendPullRequestSummaries,
  send_pull_request_summaries_to_organization:
    handleSendPullRequestSummariesToOrganization,
}

export const getDefaultWorker = () => {
  if (defaultWorker) {
    return defaultWorker
  }

  const connection = new Redis(process.env.REDIS_HOST!, {
    maxRetriesPerRequest: null,
  })

  defaultWorker = new Worker(
    defaultQueueName,
    async (job: Job) => {
      logger.debug(`got job: ${job.name}`, {
        event: 'job.start',
        data: job.data,
      })
      const handle = handlers[job.name]
      if (!handle) {
        logger.debug(`Missing job handler" ${job.name}`, {
          event: 'job.missing_handler',
          data: job.data,
        })
        return
      }

      try {
        const result = await handle(job as any) // Ignore TS, as already type-safe when accessing hadnle
        logger.debug(`Completed job: ${job.name}`, {
          event: 'job.complete',
          data: job.data,
          result,
        })
        return result
      } catch (error: unknown) {
        if (error instanceof Error) {
          logger.debug(`Failed job: ${job.name}`, {
            event: 'job.failed',
            data: job.data,
            error: error.message,
            stack: error.stack,
          })
        }

        logger.debug(`Failed job: ${job.name}`, {
          event: 'job.failed',
          data: job.data,
          error,
        })
      }
    },
    {
      connection,
      concurrency: 5,
      removeOnComplete: { count: 1000 },
      removeOnFail: { count: 5000 },
    },
  ) as any

  return defaultWorker
}

type HandlerFunc<TJob extends Job> = (job: TJob) => void | Promise<void>

type Handlers = {
  [J in Job as J['name']]: HandlerFunc<J>
}

export default getDefaultWorker()
