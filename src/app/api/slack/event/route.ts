import { NextRequest, NextResponse } from 'next/server'
import { verifySlackRequest } from '@/lib/api/slack/verify-slack-request'
import { SlackEvent } from '@slack/bolt'

export const POST = async (request: NextRequest) => {
  const payload = await request.clone().json()

  // Handle Slack ownership verification
  // Reference: https://api.slack.com/apis/connections/events-api#handshake
  if (payload.challenge) {
    return NextResponse.json({
      challenge: payload.challenge,
    })
  }

  const isValidRequest = verifySlackRequest({
    signature: request.headers.get('x-slack-signature')!,
    body: await request.clone().text(),
    timestamp: Number(request.headers.get('x-slack-request-timestamp')),
  })

  if (!isValidRequest) {
    return {
      statusCode: 400,
      body: 'Invalid request',
    }
  }

  await handleEvent(payload.event)

  return NextResponse.json({})
}

async function handleEvent(event: SlackEvent) {
  switch (event.type) {
    case 'app_mention':
    default:
      return
  }
}
