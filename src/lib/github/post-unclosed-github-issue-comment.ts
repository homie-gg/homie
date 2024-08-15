import { dbClient } from '@/database/client'
import { postGithubIssueComment } from '@/lib/github/post-github-issue-comment'

interface PostUnclosedGithubIssueCommentParams {
  task: {
    ext_gh_issue_number: number
    github_repo_id: number
  }
  pullRequest: {
    title: string
    html_url: string
  }
  organization: {
    id: number
    ext_gh_install_id: number
  }
}

export async function postUnclosedGithubIssueComment(
  params: PostUnclosedGithubIssueCommentParams,
) {
  const { task, organization, pullRequest } = params

  const githubRepository = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('github.repo.id', '=', task.github_repo_id)
    .select(['name', 'owner'])
    .executeTakeFirstOrThrow()

  if (!githubRepository.owner) {
    throw new Error('Missing Github repository owner')
  }

  await postGithubIssueComment({
    installationId: organization.ext_gh_install_id,
    repo: githubRepository.name,
    owner: githubRepository.owner,
    issueNumber: task.ext_gh_issue_number,
    body: `This might have already been done via: [${pullRequest.title}](${pullRequest.html_url}).`,
  })
}
