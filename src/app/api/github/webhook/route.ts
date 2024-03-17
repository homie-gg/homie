import { NextRequest, NextResponse } from 'next/server'
import { githubWebhooks } from '@/lib/github/github-webhooks'

export const POST = async (request: NextRequest) => {
  githubWebhooks.verifyAndReceive({
    id: request.headers.get('x-request-id')!,
    name: request.headers.get('x-github-event') as any,
    signature: request.headers.get('x-hub-signature')!,
    payload: await request.text(),
  })

  return NextResponse.json({})
}
