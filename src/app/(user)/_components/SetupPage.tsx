import { Organization } from '@/database/types'
import { Button } from '@/lib/ui/Button'

interface SetupPageProps {
  organization: Organization
  slackTeamId?: string | null
  githubInstallId?: number | null
}

export default function SetupPage(props: SetupPageProps) {
  const { githubInstallId, organization } = props

  return (
    <div className="text-center mt-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to Void.</h2>
      <p className="text-muted-foreground text-xs">
        (we hope you&apos;ll like it here)
      </p>
      <p className="my-3">
        Install the Void Github, and Void Slack App to get started.
      </p>
      <div className="flex flex-col gap-3">
        <a
          href={`https://github.com/apps/${process.env.GITHUB_APP_NAME}/installations/new?state=${organization.id}`}
          style={{
            pointerEvents: githubInstallId ? 'none' : 'all', // disable
          }}
        >
          <Button
            variant={'outline'}
            className="w-[180px]"
            disabled={!!githubInstallId}
          >
            Install Github App
          </Button>
        </a>

        <a
          href={`https://slack.com/oauth/v2/authorize?client_id=${process.env.SLACK_CLIENT_ID}&scope=app_mentions:read,channels:history,chat:write,commands,groups:history,incoming-webhook,users:read&user_scope=&state=${organization.id}`}
        >
          <Button variant={'outline'} className="w-[180px]">
            Install Slack App
          </Button>
        </a>
      </div>
    </div>
  )
}
