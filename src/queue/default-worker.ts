import { defaultQueueName } from '@/queue/default-queue'
import { handleAnswerSlackQuestion } from '@/queue/handlers/handle-answer-slack-question'
import { handleAskSlackSelectGithubRepoForIssue } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'
import { handleCreateGithubIssueFromSlack } from '@/queue/handlers/handle-create-github-issue-from-slack'
import { handleGenerateOpenPullRequestSummary } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { handleImportPullRequests } from '@/queue/handlers/handle-import-pull-requests'
import { handleSaveMergedPullRequest } from '@/queue/handlers/handle-save-merged-pull-request'
import { handleSaveOpenedPullRequest } from '@/queue/handlers/handle-save-opened-pull-request'
import { Job } from '@/queue/jobs'
import { Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

const handlers: Handlers = {
  create_github_issue_from_slack: handleCreateGithubIssueFromSlack,
  ask_slack_select_github_repo_for_issue:
    handleAskSlackSelectGithubRepoForIssue,
  import_pull_requests: handleImportPullRequests,
  save_opened_pull_request: handleSaveOpenedPullRequest,
  save_merged_pull_request: handleSaveMergedPullRequest,
  generate_open_pull_request_summary: handleGenerateOpenPullRequestSummary,
  answer_slack_question: handleAnswerSlackQuestion
}

const worker = new Worker(
  defaultQueueName,
  async (job: Job) => {
    const handle = handlers[job.name]
    if (!handle) {
      return
    }

    return handle(job as any) // Ignore TS, as already type-safe when accessing hadnle
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
)

type HandlerFunc<TJob extends Job> = (job: TJob) => void | Promise<void>

type Handlers = {
  [J in Job as J['name']]: HandlerFunc<J>
}

export default worker
