import { NextApiRequest, NextApiResponse } from 'next'
import { Webhooks, EmitterWebhookEvent } from '@octokit/webhooks'
import { createAppAuth } from '@octokit/auth-app'
import { Octokit } from '@octokit/rest'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { dbClient } from '@/database/client'

const webhooks = new Webhooks({
  secret: process.env.GITHUB_WEBHOOK_SECRET!,
})

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' })
  }

  const signature = req.headers['x-hub-signature-256'] as string
  if (!signature) {
    return res.status(400).json({ error: 'No signature' })
  }

  try {
    await webhooks.verifyAndReceive({
      id: req.headers['x-github-delivery'] as string,
      name: req.headers['x-github-event'] as string,
      payload: req.body,
      signature: signature,
    })
    res.status(200).json({ success: true })
  } catch (error) {
    console.error('Error processing webhook:', error)
    res.status(500).json({ error: 'Error processing webhook' })
  }
}

webhooks.on(
  'issue_comment.created',
  async (event: EmitterWebhookEvent<'issue_comment.created'>) => {
    const { comment, repository, installation } = event.payload
    const commentBody = comment.body.trim()

    if (!commentBody.toLowerCase().startsWith('/homie') || !installation?.id) {
      return
    }

    const query = commentBody.slice(commentBody.indexOf(' ') + 1)

    const organization = await dbClient
      .selectFrom('github.organization')
      .where('ext_gh_install_id', '=', installation.id)
      .select(['organization_id'])
      .executeTakeFirst()

    if (!organization) {
      console.error('Organization not found for installation:', installation.id)
      return
    }

    const orgData = await dbClient
      .selectFrom('homie.organization')
      .where('id', '=', organization.organization_id)
      .select([
        'id',
        'is_persona_enabled',
        'persona_positivity_level',
        'persona_g_level',
        'persona_affection_level',
        'persona_emoji_level',
        'slack_access_token',
        'ext_gh_install_id',
        'gitlab_access_token',
        'trello_access_token',
        'asana_access_token',
        'ext_trello_new_task_list_id',
        'ext_trello_done_task_list_id',
      ])
      .executeTakeFirst()

    if (!orgData) {
      console.error(
        'Organization data not found:',
        organization.organization_id,
      )
      return
    }

    const answer = await getAnswer({
      organization: orgData,
      messages: [{ type: 'human', text: query, ts: new Date().toISOString() }],
      channelID: `github:${repository.full_name}`,
    })

    const octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: process.env.GITHUB_APP_ID!,
        privateKey: process.env.GITHUB_PRIVATE_KEY!,
        installationId: installation.id,
      },
    })

    await octokit.issues.createComment({
      owner: repository.owner.login,
      repo: repository.name,
      issue_number: event.payload.issue.number,
      body: answer,
      in_reply_to: comment.id,
    })
  },
)
