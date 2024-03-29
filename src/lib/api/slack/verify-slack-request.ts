import { createHmac } from 'node:crypto'

interface VerifySlackRequestParams {
  signature: string
  timestamp: number
  body: string
}

export function verifySlackRequest(params: VerifySlackRequestParams) {
  const { signature, timestamp, body } = params
  const secret = process.env.SLACK_SIGNING_SECRET!
  const now = Math.floor(Date.now() / 1000) // match Slack timestamp precision

  // if the timestamp is more than five minutes off assume something’s funky
  if (Math.abs(now - timestamp) > 300) {
    return false
  }

  // make a hash of the request using the same approach Slack used
  const hash = createHmac('sha256', secret)
    .update(`v0:${timestamp}:${body}`)
    .digest('hex')

  // we know the request is valid if our hash matches Slack’s
  return `v0=${hash}` === signature
}
