import { getDefaultQueue } from '@/queue/default-queue'
;(async () => {
  const queue = getDefaultQueue()

  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key)
  }

  await queue.add('send_pull_request_summaries', null, {
    repeat: {
      pattern: '* * * * *', // send every minute
    },
  })

  await queue.add('refresh_gitlab_tokens', null, {
    repeat: {
      // refresh every 30 mins as gitlab has a 2 hour expiry
      pattern: '*/30 * * * *',
    },
  })

  await queue.add('refresh_asana_tokens', null, {
    repeat: {
      // refresh every 20 mins as Asana has a 1 hour expiry
      pattern: '*/20 * * * *',
    },
  })

  // eslint-disable-next-line no-console
  console.log('Scheduled jobs added.')
  process.exit()
})()
