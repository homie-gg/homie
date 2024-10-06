import { createGithubClient } from '@/lib/github/create-github-client'
import { summarizeGithubPullRequest } from '@/lib/github/summarize-github-pull-request'
import { dbClient } from '@/database/client'
import { defineJob } from '@/queue/define-job'
import { InstallationLite, PullRequest } from '@octokit/webhooks-types'

interface UpdatePullRequestSummaryCommentParams {
  pull_request: PullRequest
  installation: InstallationLite
}

export const updatePullRequestSummaryComment = defineJob(
  'update_pull_request_summary_comment',
  async (params: UpdatePullRequestSummaryCommentParams) => {
    const { pull_request, installation } = params

    const github = await createGithubClient({
      installationId: installation.id,
    })

    const { summary } = await summarizeGithubPullRequest({
      github,
      pull_request,
      length: 'long',
    })

    const [owner, repo] = pull_request.base.repo.full_name.split('/')

    // Check if a summary comment already exists
    const comments = await github.rest.issues.listComments({
      owner,
      repo,
      issue_number: pull_request.number,
    })

    const summaryComment = comments.data.find((comment) =>
      comment.body?.startsWith('## Pull Request Summary'),
    )

    const linkedTasks = await dbClient
      .selectFrom('homie.task')
      .innerJoin(
        'homie.task_pull_request',
        'task_pull_request.task_id',
        'task.id',
      )
      .where('task_pull_request.pull_request_id', '=', pull_request.id)
      .select(['task.id', 'task.name', 'task.html_url'])
      .execute()

    const linkedTasksSummary =
      linkedTasks.length > 0
        ? `\n\n## Linked Tasks\n${linkedTasks.map((task) => `- [${task.name}](${task.html_url})`).join('\n')}`
        : ''

    const commentBody = `## Pull Request Summary\n\n${summary}${linkedTasksSummary}\n\n_This summary is automatically generated and updated._`

    if (summaryComment) {
      // Update existing comment
      await github.rest.issues.updateComment({
        owner,
        repo,
        comment_id: summaryComment.id,
        body: commentBody,
      })
    } else {
      // Create new comment
      await github.rest.issues.createComment({
        owner,
        repo,
        issue_number: pull_request.number,
        body: commentBody,
      })
    }
  },
)
