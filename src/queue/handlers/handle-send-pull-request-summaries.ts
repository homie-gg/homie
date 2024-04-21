import { dbClient } from '@/lib/db/client'
import { getDefaultQueue } from '@/queue/default-queue'

export async function handleSendPullRequestSummaries() {
  const isoTime = new Date().toISOString().split('T')[1].split(':')
  const hours = isoTime[0]
  const minutes = isoTime[1]
  const defaultQueue = getDefaultQueue()

  const organizations = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'voidpm.organization.id',
    )
    .where('send_pull_request_summaries_enabled', '=', true)
    .where('send_pull_request_summaries_time', '=', `${hours}:${minutes}`)
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
