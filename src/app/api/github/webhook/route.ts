import { NextRequest, NextResponse } from 'next/server'
import { getDefaultQueue } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'
import { logger } from '@/lib/log/logger'
import { createGithubApp } from '@/lib/github/create-github-app'

export const POST = async (request: NextRequest) => {
  logger.debug('Received Github webhook', {
    event: 'github.webhook.received',
    data: JSON.stringify(await request.clone().json()),
  })

  const app = createGithubApp()

  app.webhooks.on('pull_request.closed', async (params) => {
    const {
      payload: { pull_request, installation },
    } = params

    await getDefaultQueue().add('save_merged_pull_request', {
      pull_request,
      installation,
    })

    await getDefaultQueue().add('close_linked_tasks', {
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
