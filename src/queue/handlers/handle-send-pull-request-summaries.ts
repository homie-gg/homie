import { dbClient } from '@/database/client'
import { getDefaultQueue } from '@/queue/default-queue'
import { formatInTimeZone } from 'date-fns-tz'

export async function handleSendPullRequestSummaries() {
  const today = formatInTimeZone(new Date(), 'UTC', 'i')
  const time = formatInTimeZone(new Date(), 'UTC', 'kk:mm')

  const defaultQueue = getDefaultQueue()

  const organizations = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .where('send_pull_request_summaries_enabled', '=', true)
    .where('send_pull_request_summaries_time', '=', time)
    .select([
      'homie.organization.id',
      'send_pull_request_summaries_time',
      'send_pull_request_summaries_interval',
      'send_pull_request_summaries_day',
      'slack_access_token',
      'ext_slack_webhook_channel_id',
    ])
    .execute()

  for (const organization of organizations) {
    const isCorrectDay = organization.send_pull_request_summaries_day === today

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
