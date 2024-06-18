import { NextRequest } from 'next/server'
import crypto from 'node:crypto'

interface VerifyTrelloWebhookParams {
  data: Record<string, any>
  callbackURL: string
  webhookHash: string
}

export function verifyTrelloWebhook(params: VerifyTrelloWebhookParams) {
  const { data, callbackURL, webhookHash } = params

  const content = JSON.stringify(data) + callbackURL

  const hash = crypto
    .createHmac('sha1', process.env.TRELLO_SECRET ?? '')
    .update(content)
    .digest('base64')

  return hash === webhookHash
}
