import { MessageEvent } from '@slack/bolt'

export type Conversation = {
  messages: MessageEvent[]
  ok: boolean
  latest: string
}

export type TextMessageEvent = {
  text: string
  ts: string
}

export type SlackAccessTokenResponse = {
  app_id: string
  access_token: string
  team: {
    id: string
    name: string
  }
  incoming_webhook: {
    url: string
    channel: string
    channel_id: string
  }
}
