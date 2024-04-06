import { NextRequest, NextResponse } from 'next/server'
import { App } from 'octokit'
import { getPrivateKey } from '@/lib/github/create-github-client'
import { getDefaultQueue } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'

export const POST = async (request: NextRequest) => {
  const app = new App({
    appId: process.env.GITHUB_APP_ID!,
    privateKey: getPrivateKey().toString('utf-8'),
    webhooks: {
      secret: process.env.GITHUB_WEBHOOK_SECRET!,
    },
  })

  app.webhooks.on('pull_request.closed', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    await getDefaultQueue().add('save_merged_pull_request', {
      pull_request,
      installation,
    })
  })

  app.webhooks.on('pull_request.edited', async (params) => {
    const { pull_request, installation } = params.payload

    if (pull_request.body?.includes(summaryKey)) {
      await getDefaultQueue().add('generate_open_pull_request_summary', {
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.on('pull_request.opened', async (params) => {
    const { pull_request, installation } = params.payload

    await getDefaultQueue().add('save_opened_pull_request', {
      pull_request,
      installation,
    })

    if (pull_request.body?.includes(summaryKey)) {
      await getDefaultQueue().add('generate_open_pull_request_summary', {
        pull_request,
        installation,
      })
    }
  })

  app.webhooks.verifyAndReceive({
    id: request.headers.get('x-request-id')!,
    name: request.headers.get('x-github-event') as any,
    signature: request.headers.get('x-hub-signature')!,
    payload: await request.text(),
  })

  return NextResponse.json({})
}
