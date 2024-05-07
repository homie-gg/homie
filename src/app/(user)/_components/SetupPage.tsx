import { Organization } from '@/database/types'
import { getGithubInstallUrl } from '@/lib/github/get-github-install-url'
import { getGitlabInstallUrl } from '@/lib/gitlab/get-install-gitlab-url'
import { getSlackInstallUrl } from '@/lib/slack/get-slack-install-url'
import { Button } from '@/lib/ui/Button'

interface SetupPageProps {
  organization: Organization
  slackTeamId?: string | null
  githubInstallId?: number | null
  gitlabAccessToken?: string | null
}

export default function SetupPage(props: SetupPageProps) {
  const { githubInstallId, organization, gitlabAccessToken } = props

  const hasInstalledCodeRepoApp =
    Boolean(githubInstallId) || Boolean(gitlabAccessToken)

  return (
    <div className="text-center mt-6">
      <h2 className="text-3xl font-bold tracking-tight">Welcome to Void.</h2>
      <p className="text-muted-foreground text-xs">
        (we hope you&apos;ll like it here)
      </p>
      <p className="my-3">
        Install the Void Github, and Void Slack App to get started.
      </p>
      <div className="flex flex-col gap-8 mt-6">
        <div className="flex gap-4 items-center justify-center">
          <a
            href={getGithubInstallUrl({ organization })}
            style={{
              pointerEvents: hasInstalledCodeRepoApp ? 'none' : 'all', // disable
            }}
          >
            <Button
              variant={'outline'}
              className="w-[180px]"
              disabled={hasInstalledCodeRepoApp}
            >
              Install GitHub
            </Button>
          </a>

          <span>or</span>

          <a
            href={getGitlabInstallUrl({ organization })}
            style={{
              pointerEvents: hasInstalledCodeRepoApp ? 'none' : 'all', // disable
            }}
          >
            <Button
              variant={'outline'}
              className="w-[180px]"
              disabled={hasInstalledCodeRepoApp}
            >
              Install Gitlab
            </Button>
          </a>
        </div>

        <a href={getSlackInstallUrl({ organization })}>
          <Button variant={'outline'} className="w-[180px]">
            Install Slack App
          </Button>
        </a>
      </div>
    </div>
  )
}
