import { NextRequest, NextResponse } from 'next/server'
import { app } from '@/lib/github/app'

export const POST = async (request: NextRequest) => {
  app.webhooks.verifyAndReceive({
    id: request.headers.get('x-request-id')!,
    name: request.headers.get('x-github-event') as any,
    signature: request.headers.get('x-hub-signature')!,
    payload: await request.text(),
  })

  return NextResponse.json({})
}
