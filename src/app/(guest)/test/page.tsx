import { dbClient } from '@/database/client'
import { sendOrganizationDailyReport } from '@/queue/jobs/send-organization-daily-report'

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

  await sendOrganizationDailyReport.dispatch({
    organization,
  })

  return <div>{new Date().getSeconds()}</div>
}
