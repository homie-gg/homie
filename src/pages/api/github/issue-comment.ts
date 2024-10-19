import { NextApiRequest, NextApiResponse } from 'next'
import { writeCode } from '@/queue/jobs/write-code'
import { createGithubClient } from '@/lib/github/create-github-client'
import { dbClient } from '@/database/client'

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { body } = req
  const { action, issue, comment, repository, installation } = body

  if (action !== 'created' || !issue || !comment || !repository || !installation) {
    return res.status(400).json({ message: 'Invalid webhook payload' })
  }

  const triggerPhrase = '/write-code'
  if (!comment.body.startsWith(triggerPhrase)) {
    return res.status(200).json({ message: 'No action required' })
  }

  const instructions = comment.body.slice(triggerPhrase.length).trim()

  const organization = await dbClient
    .selectFrom('github.organization')
    .where('ext_gh_install_id', '=', installation.id)
    .innerJoin('homie.organization', 'homie.organization.id', 'github.organization.organization_id')
    .select(['homie.organization.id', 'homie.organization.slack_access_token'])
    .executeTakeFirst()

  if (!organization) {
    return res.status(404).json({ message: 'Organization not found' })
  }

  const repo = await dbClient
    .selectFrom('github.repo')
    .where('ext_gh_repo_id', '=', repository.id)
    .select(['id'])
    .executeTakeFirst()

  if (!repo) {
    return res.status(404).json({ message: 'Repository not found' })
  }

  await writeCode.dispatch({
    organization: {
      id: organization.id,
      ext_gh_install_id: installation.id,
      gitlab_access_token: null,
      slack_access_token: organization.slack_access_token,
    },
    instructions,
    github_repo_id: repo.id,
    slack_target_message_ts: '', // We don't have a Slack message in this context
    slack_channel_id: '', // We don't have a Slack channel in this context
    answer_id: `github-issue-${issue.id}`,
  })

  const github = await createGithubClient({ installationId: installation.id })
  await github.rest.issues.createComment({
    owner: repository.owner.login,
    repo: repository.name,
    issue_number: issue.number,
    body: 'I've started working on this. I'll open a PR once it's ready.',
  })

  return res.status(200).json({ message: 'Job dispatched successfully' })
}
