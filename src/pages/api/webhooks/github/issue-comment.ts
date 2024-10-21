import { NextApiRequest, NextApiResponse } from 'next'
import { Webhooks } from '@octokit/webhooks'
import { createGithubClient } from '@/lib/github/create-github-client'
import { dbClient } from '@/database/client'
import { writeCode } from '@/queue/jobs/write-code'
import { logger } from '@/lib/log/logger'

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  const payload = req.body
  const signature = req.headers['x-hub-signature-256'] as string

  try {
    await webhooks.verify(JSON.stringify(payload), signature)
  } catch (error) {
    return res.status(401).json({ error: 'Invalid signature' })
  }

  if (payload.action !== 'created') {
    return res.status(200).json({ message: 'Ignored non-create action' })
  }

  const issueComment = payload.comment.body.trim()
  if (!issueComment.startsWith('/homie do this')) {
    return res.status(200).json({ message: 'Ignored non-homie-do-this comment' })
  }

  const instructions = issueComment.replace('/homie do this', '').trim()
  const { repository, issue } = payload

  try {
    const organization = await dbClient
      .selectFrom('github.organization')
      .where('ext_gh_org_id', '=', repository.owner.id)
      .select(['organization_id', 'ext_gh_install_id'])
      .executeTakeFirstOrThrow()

    const repo = await dbClient
      .selectFrom('github.repo')
      .where('ext_gh_repo_id', '=', repository.id)
      .select(['id'])
      .executeTakeFirstOrThrow()

    const github = await createGithubClient({
      installationId: organization.ext_gh_install_id,
    })

    const issueDetails = await github.rest.issues.get({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
    })

    await writeCode.dispatch({
      organization: {
        id: organization.organization_id,
        ext_gh_install_id: organization.ext_gh_install_id,
      },
      instructions,
      github_repo_id: repo.id,
      issue_number: issue.number,
      issue_title: issueDetails.data.title,
      issue_body: issueDetails.data.body || '',
      answer_id: 'github-issue-comment',
    })

    await github.rest.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: issue.number,
      body: 'I've started working on this. I'll open a PR once the code is ready.',
    })

    return res.status(200).json({ message: 'Write code job dispatched' })
  } catch (error) {
    logger.error('Failed to handle GitHub issue comment webhook', {
      error,
      payload,
    })
    return res.status(500).json({ error: 'Internal server error' })
  }
}

export const config = {
  api: {
    bodyParser: false,
  },
}
