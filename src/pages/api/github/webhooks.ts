import { buffer } from 'micro'
import { NextApiRequest, NextApiResponse } from 'next'
import { Webhooks, createNodeMiddleware } from '@octokit/webhooks'
import { createGithubClient } from '@/lib/github/create-github-client'
import { prisma } from '@/lib/prisma'
import { dispatch } from '@/queue/dispatch'
import {
  generateSummary,
  createOrUpdateGithubComment,
} from '@/lib/pullRequests/generateSummary'

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
})

webhooks.on('pull_request.opened', async ({ payload }) => {
  const organization = await prisma.organization.findFirst({
    where: {
      ext_gh_install_id: payload.installation?.id,
    },
  })

  if (!organization) {
    console.error('Organization not found')
    return
  }

  const octokit = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const { data: pullRequest } = await octokit.pulls.get({
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    pull_number: payload.pull_request.number,
  })

  // Generate summary
  const summary = await generateSummary({
    title: pullRequest.title,
    body: pullRequest.body || '',
    diffUrl: pullRequest.diff_url,
    organizationId: organization.id,
  })

  // Create or update comment with summary
  await createOrUpdateGithubComment(
    organization.ext_gh_install_id,
    payload.repository.owner.login,
    payload.repository.name,
    pullRequest.number,
    summary,
  )

  await dispatch('github:analyze-pull-request', {
    organizationId: organization.id,
    pullRequestId: pullRequest.id,
    installationId: organization.ext_gh_install_id,
    owner: payload.repository.owner.login,
    repo: payload.repository.name,
    number: payload.pull_request.number,
  })
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method === 'POST') {
    const buf = await buffer(req)
    const sig = req.headers['x-hub-signature-256'] as string

    try {
      await webhooks.verifyAndReceive({
        id: req.headers['x-github-delivery'] as string,
        name: req.headers['x-github-event'] as string,
        payload: buf,
        signature: sig,
      })
      res.status(200).json({ message: 'Webhook received' })
    } catch (error) {
      console.error('Error processing webhook:', error)
      res.status(500).json({ error: 'Error processing webhook' })
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' })
  }
}
