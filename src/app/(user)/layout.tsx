import AppBar from '@/app/(user)/AppBar'
import Content from '@/app/(user)/Content'
import SetupPage from '@/app/(user)/_components/SetupPage'
import { MainNav } from '@/app/(user)/_components/MainNav'
import { dbClient } from '@/lib/db/client'
import { auth, clerkClient } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

interface UserLayoutProps {
  children: React.ReactNode
}

export default async function UserLayout(props: UserLayoutProps) {
  const { children } = props
  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const user = await clerkClient.users.getUser(userId)

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .leftJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .leftJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'voidpm.organization.id',
    )
    .selectAll('voidpm.organization')
    .select([
      'github.organization.ext_gh_install_id',
      'slack.workspace.ext_slack_team_id',
    ])
    .executeTakeFirst()

  if (!organization) {
    const newOrganization = await dbClient
      .insertInto('voidpm.organization')
      .values({
        ext_clerk_user_id: userId,
      })
      .returningAll()
      .executeTakeFirstOrThrow()

    return (
      <div className="flex flex-col">
        <AppBar user={user} />
        <Content>
          <SetupPage organization={newOrganization} />
        </Content>
      </div>
    )
  }

  if (!organization.ext_slack_team_id || !organization.ext_gh_install_id) {
    return (
      <div className="flex flex-col">
        <AppBar user={user} />
        <Content>
          <SetupPage
            organization={organization}
            slackTeamId={organization.ext_slack_team_id}
            githubInstallId={organization.ext_gh_install_id}
          />
        </Content>
      </div>
    )
  }

  return (
    <div className="flex flex-col">
      <AppBar user={user}>
        <MainNav className="mx-6" />
      </AppBar>
      <Content>{children}</Content>
    </div>
  )
}
