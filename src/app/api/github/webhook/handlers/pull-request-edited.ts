import { app } from '@/lib/github/app'
import { defaultQueue } from '@/queue/default-queue'
import { summaryKey } from '@/queue/handlers/handle-generate-open-pull-request-summary'

app.webhooks.on('pull_request.edited', async (params) => {
  const { pull_request, installation } = params.payload

  if (pull_request.body?.includes(summaryKey)) {
    await defaultQueue.add('generate_open_pull_request_summary', {
      pull_request,
      installation,
    })
  }
})
