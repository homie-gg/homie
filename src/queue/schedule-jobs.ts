import { config } from '@/config'
import { dispatch } from '@/queue/dispatch'
import { getQueue } from '@/queue/get-queue'
;(async () => {
  const queues = Object.keys(config.queue.queues)
  for (const name of queues) {
    const queue = getQueue(name)

    const repeatableJobs = await queue.getRepeatableJobs()
    if (!repeatableJobs) {
      continue
    }

    for (const job of repeatableJobs) {
      await queue.removeRepeatableByKey(job.key)
    }
  }

  await dispatch('send_pull_request_summaries', null, {
    repeat: {
      pattern: '* * * * *', // send every minute
    },
  })

  await dispatch('refresh_gitlab_tokens', null, {
    queue: 'high',
    repeat: {
      // refresh every 30 mins as gitlab has a 2 hour expiry
      pattern: '*/30 * * * *',
    },
  })

  await dispatch('refresh_asana_tokens', null, {
    queue: 'high',
    repeat: {
      // refresh every 20 mins as Asana has a 1 hour expiry
      pattern: '*/20 * * * *',
    },
  })

  await dispatch('calculate_organization_complexity_score_per_day', null, {
    repeat: {
      // weekly at 00:00 Sunday
      // Must update cut-off date in job handler if this
      // is changed.
      pattern: '0 0 * * 0',
    },
  })

  // eslint-disable-next-line no-console
  console.log('Scheduled jobs added.')
  process.exit()
})()
