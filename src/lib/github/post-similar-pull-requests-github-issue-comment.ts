import { dbClient } from '@/database/client'
import { postGithubIssueComment } from '@/lib/github/post-github-issue-comment'

interface PostSimilarPullRequestsGithubCommentParams {
  targetTask: {
    ext_gh_issue_number: number
    github_repo_id: number
  }
  pullRequests: Array<{ id: number; title: string; html_url: string }>
  organization: {
    id: number
    ext_gh_install_id: number
  }
}

export async function postSimilarPullRequestsGithubIssueComment(
  params: PostSimilarPullRequestsGithubCommentParams,
) {
  const { targetTask, organization, pullRequests } = params

  const githubRepository = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('github.repo.id', '=', targetTask.github_repo_id)
    .select(['name', 'owner'])
    .executeTakeFirstOrThrow()

  if (!githubRepository.owner) {
    throw new Error('Missing Github repository owner')
  }

  const body = `Here are some pull requests that could be similar to this task:\n${pullRequests.map((pullRequest) => `- [${pullRequest.title}](${pullRequest.html_url})`).join('\n')}`

  await postGithubIssueComment({
    installationId: organization.ext_gh_install_id,
    repo: githubRepository.name,
    owner: githubRepository.owner,
    issueNumber: targetTask.ext_gh_issue_number,
    body,
  })
}
