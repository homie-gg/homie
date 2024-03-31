import { app } from '@/lib/github/app'
import { defaultQueue } from '@/queue/default-queue'

app.webhooks.on('pull_request.closed', async (params) => {
  const {
    payload: { pull_request, installation },
  } = params

  await defaultQueue.add('save_merged_pull_request', {
    pull_request,
    installation,
  })
})

export const githubWebhooks = app.webhooks
