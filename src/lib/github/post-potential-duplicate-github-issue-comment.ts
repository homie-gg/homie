import { dbClient } from '@/database/client'
import { getGreeting } from '@/lib/ai/get-greeting'
import { postGithubIssueComment } from '@/lib/github/post-github-issue-comment'

interface PostPotentialDuplicateGithubIssueCommentParams {
  targetTask: {
    ext_gh_issue_number: number
    github_repo_id: number
  }
  duplicateTask: {
    name: string
    html_url: string
  }
  organization: {
    id: number
    ext_gh_install_id: number
  }
}

export async function postPotentialDuplicateGithubIssueComment(
  params: PostPotentialDuplicateGithubIssueCommentParams,
) {
  const { targetTask, organization, duplicateTask } = params

  const githubRepository = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('github.repo.id', '=', targetTask.github_repo_id)
    .select(['name', 'owner'])
    .executeTakeFirstOrThrow()

  if (!githubRepository.owner) {
    throw new Error('Missing Github repository owner')
  }

  await postGithubIssueComment({
    installationId: organization.ext_gh_install_id,
    repo: githubRepository.name,
    owner: githubRepository.owner,
    issueNumber: targetTask.ext_gh_issue_number,
    body: `${getGreeting()}, this issue might be a duplicate of: [${duplicateTask.name}](${duplicateTask.html_url}).`,
  })
}
