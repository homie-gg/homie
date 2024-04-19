import { getDefaultQueue } from '@/queue/default-queue'
;(async () => {
  const queue = getDefaultQueue()

  const repeatableJobs = await queue.getRepeatableJobs()
  for (const job of repeatableJobs) {
    await queue.removeRepeatableByKey(job.key)
  }

  await queue.add('reset_organizations_over_pr_limit', null, {
    repeat: {
      pattern: '0 0 1 * *', // every month
    },
  })

  await queue.add('send_pull_request_summaries', null, {
    repeat: {
      pattern: '* * * * *', // send every minute
    },
  })

  // eslint-disable-next-line no-console
  console.log('Scheduled jobs added.')
  process.exit()
})()
