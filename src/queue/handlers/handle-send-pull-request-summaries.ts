import { dbClient } from '@/lib/db/client'
import { getDefaultQueue } from '@/queue/default-queue'
import { format } from 'date-fns'

export async function handleSendPullRequestSummaries() {
  const now = new Date()
  const defaultQueue = getDefaultQueue()

  const organizations = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'voidpm.organization.id',
    )
    .where('send_pull_request_summaries_enabled', '=', true)
    .where('send_pull_request_summaries_time', '=', format(now, 'kk:mm'))
    .select([
      'voidpm.organization.id',
      'send_pull_request_summaries_time',
      'send_pull_request_summaries_interval',
      'send_pull_request_summaries_day',
      'slack_access_token',
      'ext_slack_webhook_channel_id',
    ])
    .execute()

  for (const organization of organizations) {
    const isCorrectDay =
      organization.send_pull_request_summaries_day === now.getDay().toString()

    if (
      organization.send_pull_request_summaries_interval === 'weekly' &&
      !isCorrectDay
    ) {
      continue
    }

    defaultQueue.add('send_pull_request_summaries_to_organization', {
      organization,
    })
  }
}
