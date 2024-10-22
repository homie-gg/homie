import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { writeCode } from '@/queue/jobs/write-code'
import {
  InstallationLite,
  Issue,
  IssueComment,
  Repository,
} from '@octokit/webhooks-types'

const triggerPhrase = '/homie do this'

interface WorkOnGithubIssueParams {
  issue: Issue
  installation?: InstallationLite | undefined
  comment: IssueComment
  repository: Repository
}

export async function workOnGithubIssue(params: WorkOnGithubIssueParams) {
  const { installation, issue, comment, repository } = params
  if (!installation) {
    return
  }

  if (issue.state === 'closed') {
    return
  }

  if (!comment.body.toLowerCase().startsWith(triggerPhrase)) {
    return
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .where('ext_gh_install_id', '=', installation.id)
    .select(['homie.organization.id', 'ext_gh_install_id'])
    .executeTakeFirst()

  if (!organization) {
    return
  }

  const commentInstructions = comment.body
    .replace(new RegExp(triggerPhrase, 'i'), '')
    .trim()
  const instructions = `${issue.title}\n${issue.body}\n${commentInstructions}`

  const repo = await dbClient
    .insertInto('github.repo')
    .values({
      organization_id: organization.id,
      owner: repository.owner.login,
      name: repository.name,
      html_url: repository.html_url,
      ext_gh_repo_id: repository.id,
    })
    .onConflict((oc) =>
      oc.column('ext_gh_repo_id').doUpdateSet({
        organization_id: organization.id,
        owner: repository.owner.login,
        name: repository.name,
        html_url: repository.html_url,
      }),
    )
    .returning(['id', 'owner', 'name'])
    .executeTakeFirstOrThrow()

  if (!organization.ext_gh_install_id) {
    return
  }

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  await writeCode.dispatch({
    organization: {
      id: organization.id,
      ext_gh_install_id: installation.id,
    },
    instructions,
    github_repo_id: repo.id,
    answer_id: `github-issue-${issue.id}`,
    github_issue_number: issue.number,
  })

  if (!repo.owner) {
    return
  }

  await github.rest.issues.createComment({
    issue_number: issue.number,
    owner: repo.owner,
    repo: repo.name,
    body: `Sure, I've started working on this. Will open a PR in a minute once this is ready.`,
  })
}
