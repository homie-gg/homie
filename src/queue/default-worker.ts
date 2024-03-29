import { defaultQueueName } from '@/queue/default-queue'
import { handleAskSlackSelectGithubRepoForIssue } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'
import { handleCreateGithubIssueFromSlack } from '@/queue/handlers/handle-create-github-issue-from-slack'
import { Job } from '@/queue/jobs'
import { Worker } from 'bullmq'
import Redis from 'ioredis'

const connection = new Redis(process.env.REDIS_URL!, {
  maxRetriesPerRequest: null,
})

const worker = new Worker(
  defaultQueueName,
  async (job: Job) => {
    switch (job.name) {
      case 'create_github_issue_from_slack':
        return await handleCreateGithubIssueFromSlack(job)
      case 'ask_slack_select_github_repo_for_issue':
        return await handleAskSlackSelectGithubRepoForIssue(job)
    }
  },
  {
    connection,
    concurrency: 5,
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 5000 },
  },
)

export default worker
