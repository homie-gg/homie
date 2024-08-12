import AppBar from '@/app/(user)/AppBar'
import Content from '@/app/(user)/Content'
import SetupPage from '@/app/(user)/_components/SetupPage'
import { MainNav } from '@/app/(user)/_components/MainNav'
import { dbClient } from '@/database/client'
import { auth, clerkClient } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { mailchimp } from '@/lib/mailchimp'
import { config } from '@/config'

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
    .selectFrom('homie.organization')
    .leftJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'gitlab.app_user',
      'gitlab.app_user.organization_id',
      'homie.organization.id',
    )
    .selectAll('homie.organization')
    .select([
      'github.organization.ext_gh_install_id',
      'slack.workspace.ext_slack_team_id',
      'gitlab_access_token',
      'has_completed_setup',
    ])
    .where('ext_clerk_user_id', '=', userId)
    .executeTakeFirst()

  if (!organization) {
    const mailchimpSubscriberHash = config.app.isProduction
      ? await mailchimp.subscribeUser({
          email: user.emailAddresses[0].emailAddress,
        })
      : null

    const newOrganization = await dbClient
      .insertInto('homie.organization')
      .values({
        ext_clerk_user_id: userId,
        mailchimp_subscriber_hash: mailchimpSubscriberHash,
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

  if (
    !organization.ext_slack_team_id ||
    (!organization.ext_gh_install_id && !organization.gitlab_access_token)
  ) {
    return (
      <div className="flex flex-col">
        <AppBar user={user} />
        <Content>
          <SetupPage
            organization={organization}
            slackTeamId={organization.ext_slack_team_id}
            githubInstallId={organization.ext_gh_install_id}
            gitlabAccessToken={organization.gitlab_access_token}
          />
        </Content>
      </div>
    )
  }

  if (
    config.app.isProduction &&
    !organization.has_completed_setup &&
    organization.mailchimp_subscriber_hash
  ) {
    await mailchimp.markCompletedSetup({
      subscriberHash: organization.mailchimp_subscriber_hash,
    })
  }

  if (!organization.has_completed_setup) {
    await dbClient
      .updateTable('homie.organization')
      .where('id', '=', organization.id)
      .set({
        has_completed_setup: true,
      })
      .executeTakeFirstOrThrow()
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
