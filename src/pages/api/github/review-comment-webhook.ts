import { NextApiRequest, NextApiResponse } from 'next'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { createGithubClient } from '@/lib/github/create-github-client'
import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ message: 'Method not allowed' })
  }

  const { body } = req

  if (
    body.action !== 'created' ||
    !body.comment ||
    !body.comment.body.includes('@homie')
  ) {
    return res.status(200).json({ message: 'No action needed' })
  }

  try {
    const organization = await dbClient
      .selectFrom('homie.organization')
      .where('ext_gh_install_id', '=', body.installation.id)
      .select([
        'id',
        'ext_gh_install_id',
        'is_persona_enabled',
        'persona_positivity_level',
        'persona_g_level',
        'persona_affection_level',
        'persona_emoji_level',
      ])
      .executeTakeFirst()

    if (!organization) {
      logger.error('Organization not found for GitHub installation', {
        installation_id: body.installation.id,
      })
      return res.status(404).json({ message: 'Organization not found' })
    }

    const message = body.comment.body.replace('@homie', '').trim()
    const answer = await getAnswer({
      organization,
      messages: [
        { type: 'human', text: message, ts: new Date().toISOString() },
      ],
      channelID: `github-${body.repository.id}`,
    })

    const github = await createGithubClient({
      installationId: organization.ext_gh_install_id,
    })

    await github.rest.pulls.createReviewComment({
      owner: body.repository.owner.login,
      repo: body.repository.name,
      pull_number: body.pull_request.number,
      body: answer,
      commit_id: body.comment.commit_id,
      path: body.comment.path,
      line: body.comment.line,
    })

    res.status(200).json({ message: 'Response posted successfully' })
  } catch (error) {
    logger.error('Error processing GitHub review comment webhook', {
      error: error instanceof Error ? error.message : 'Unknown error',
    })
    res.status(500).json({ message: 'Internal server error' })
  }
}
