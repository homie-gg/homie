import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { formatInTimeZone } from 'date-fns-tz'
import { sendOrganizationDailyReport } from '@/queue/jobs/send-organization-daily-report'

export const sendDailyReports = createJob({
  id: 'send_daily_reports',
  handle: async () => {
    const time = formatInTimeZone(new Date(), 'UTC', 'kk:mm')

    const organizations = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'slack.workspace',
        'slack.workspace.organization_id',
        'homie.organization.id',
      )
      .where('send_daily_report_time', '=', time)
      .select([
        'homie.organization.id',
        'slack_access_token',
        'ext_slack_webhook_channel_id',
        'ext_slack_bot_user_id',
      ])
      .execute()

    for (const organization of organizations) {
      sendOrganizationDailyReport.dispatch({
        organization,
      })
    }
  },
})
