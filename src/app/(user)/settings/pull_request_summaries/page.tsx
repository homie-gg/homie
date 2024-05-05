import { Separator } from '@/lib/ui/Separator'
import PullRequestSumariesSettingsForm from '@/app/(user)/settings/pull_request_summaries/_components/PullRequestSumariesSettingsForm'
import { getUserOrganization } from '@/lib/auth/get-user-organization'

interface PRSummariesPage {}

export default async function PRSummariesPage(props: PRSummariesPage) {
  const {} = props

  const organization = await getUserOrganization()
  if (!organization) {
    return null
  }

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Pull Request Summaries</h3>
        <p className="text-sm text-muted-foreground">
          Schedule homie to send a list of merged pull requests to Slack.
        </p>
      </div>
      <Separator />
      <div className="space-y-4">
        <PullRequestSumariesSettingsForm organization={organization} />
      </div>
    </div>
  )
}
