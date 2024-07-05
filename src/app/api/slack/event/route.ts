import { NextRequest, NextResponse } from 'next/server'
import { verifySlackRequest } from '@/lib/slack/verify-slack-request'
import { SlackEvent } from '@slack/bolt'
import { logger } from '@/lib/log/logger'
import { debouncedDispatch } from '@/queue/debounced-dispatch'
import { generateUuid } from '@/lib/crypto/generate-uuid'

/**
 * How long to wait before sending a reply to a thread. This is to prevent
 * cases where users fire off multiple messsages consecutively, and we
 * reply multiple times.
 */
const threadReplyDebounceSecs = 2

export const POST = async (request: NextRequest) => {
  const payload = await request.clone().json()

  logger.debug('Received Slack webhook', {
    event: 'slack.webhook.received',
    data: JSON.stringify(payload),
  })

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
    case 'app_mention': {
      await debouncedDispatch({
        job: {
          name: 'reply_slack_mention',
          data: {
            team_id,
            channel_id: event.channel,
            target_message_ts: event.ts,
            thread_ts: event.thread_ts,
            text: event.text,
          },
        },
        debounce: {
          key: `reply_slack:${event.thread_ts ?? event.ts}`,
          id: generateUuid(),
          delaySecs: threadReplyDebounceSecs,
        },
      })
    }
    default:
      return
  }
}
