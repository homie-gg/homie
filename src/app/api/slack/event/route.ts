import { NextRequest, NextResponse } from 'next/server'
import { verifySlackRequest } from '@/lib/api/slack/verify-slack-request'
import { getDefaultQueue } from '@/queue/default-queue'
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
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 })
  }

  await handleEvent({ event: payload.event, team_id: payload.team_id })

  return NextResponse.json({})
}

interface HandleEventParams {
  event: SlackEvent
  team_id: string
}

async function handleEvent(params: HandleEventParams) {
  const { event, team_id } = params
  switch (event.type) {
    case 'app_mention':
      await getDefaultQueue().add('answer_slack_question', {
        team_id,
        channel_id: event.channel,
        target_message_ts: event.ts,
        text: event.text,
      })
    default:
      return
  }
}
