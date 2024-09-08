import { dbClient } from '@/database/client'
import { dispatch } from '@/queue/dispatch'

interface TestPageProps {}

export default async function TestPage(props: TestPageProps) {
  const {} = props

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .select([
      'homie.organization.id',
      'slack_access_token',
      'ext_slack_webhook_channel_id',
      'ext_slack_bot_user_id',
    ])
    .executeTakeFirstOrThrow()

  await dispatch('send_organization_daily_report', {
    organization,
  })

  return <div>{new Date().getSeconds()}</div>
}
