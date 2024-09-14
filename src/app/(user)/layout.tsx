import AppBar from '@/app/(user)/AppBar'
import Page from '@/app/(user)/_components/Page'
import Content from '@/app/(user)/Content'
import { MainNav } from '@/app/(user)/_components/MainNav'
import { dbClient } from '@/database/client'
import { auth, clerkClient } from '@clerk/nextjs'
import { redirect } from 'next/navigation'
import { mailchimp } from '@/lib/mailchimp'
import { config } from '@/config'
import Script from 'next/script'
import { findOrCreateOrganization } from '@/lib/organization/find-or-create-orgainzation'
import Onboarding from '@/app/(user)/_components/Onboarding'
import NavBar from '@/app/(user)/_components/NavBar'
import NavLinks from '@/app/(user)/_components/NavLinks'

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

  const { organization, isNew: isNewOrganization } =
    await findOrCreateOrganization({
      extClerkUserId: userId,
      email: user.emailAddresses[0].emailAddress,
    })

  if (
    !organization.owner_name ||
    !organization.ext_slack_team_id ||
    (!organization.ext_gh_install_id && !organization.gitlab_access_token)
  ) {
    return (
      <>
        {isNewOrganization && config.app.isProduction && (
          <Script id="google-analytics-signed-up">
            {`gtag('event', 'signed_up')`}
          </Script>
        )}
        <Page>
          <Onboarding organization={organization} />
        </Page>
      </>
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
    <div className="relative w-full">
      <NavBar user={user}>
        <NavLinks />
      </NavBar>
      {/* <AppBar user={user}>
        MainNav className="mx-6" />
      </AppBar> */}

      <Page>{children}</Page>
    </div>
  )
}
