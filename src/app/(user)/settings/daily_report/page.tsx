import { Separator } from '@/lib/ui/Separator'
import PullRequestSumariesSettingsForm from '@/app/(user)/settings/pull_request_summaries/_components/PullRequestSumariesSettingsForm'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import DailyReportSettingsForm from '@/app/(user)/settings/daily_report/_components/DailyReportSettingsForm'

export default async function DailyReportSettingsPage() {
  const organization = await getUserOrganization()
  if (!organization) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Daily Report</h3>
        <p className="text-sm text-muted-foreground">
          Configure when Homie should send out Daily Reports to Slack.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <DailyReportSettingsForm organization={organization} />
      </div>
    </div>
  )
}
