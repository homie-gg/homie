import { app } from '@/lib/github/app'

app.webhooks.on('pull_request.opened', async (params) => {
  // create PR
  // Add timestamp for WHEN the PR was merged
})
