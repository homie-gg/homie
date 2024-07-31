import { dbClient } from '@/database/client'
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

const greetings = ['Hmm', 'One sec', 'Oops', 'Yo', 'Woah', 'Hi homie']

export async function postPotentialDuplicateGithubIssueComment(
  params: PostPotentialDuplicateGithubIssueCommentParams,
) {
  const { targetTask: task, organization, duplicateTask } = params

  const githubRepository = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('github.repo.id', '=', task.github_repo_id)
    .select(['name', 'owner'])
    .executeTakeFirstOrThrow()

  if (!githubRepository.owner) {
    throw new Error('Missing Github repository owner')
  }

  const greeting = greetings[Math.floor(Math.random() * greetings.length)]

  await postGithubIssueComment({
    installationId: organization.ext_gh_install_id,
    repo: githubRepository.name,
    owner: githubRepository.owner,
    issueNumber: task.ext_gh_issue_number,
    body: `${greeting}, this issue might be a duplicate of: [${duplicateTask.name}](${duplicateTask.html_url}).`,
  })
}
