import { NextRequest, NextResponse } from 'next/server'
import { logger } from '@/lib/log/logger'
import { createGithubWebhooks } from '@/lib/github/create-github-webhooks'

export const POST = async (request: NextRequest) => {
  logger.debug('Received Github webhook', {
    event: 'github.webhook.received',
    data: JSON.stringify(await request.clone().json()),
  })

  const githubWebhooks = createGithubWebhooks()

  await githubWebhooks.verifyAndReceive({
    id: request.headers.get('x-request-id')!,
    name: request.headers.get('x-github-event') as any,
    signature: request.headers.get('x-hub-signature')!,
    payload: await request.text(),
  })

  return NextResponse.json({})
}
