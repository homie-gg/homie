import { config } from '@/config'
import { dbClient } from '@/database/client'
import { mailchimp } from '@/lib/mailchimp'

interface FindOrCreateOrganizationParams {
  extClerkUserId: string
  email: string
}

export async function findOrCreateOrganization(
  params: FindOrCreateOrganizationParams,
) {
  const { extClerkUserId, email } = params

  const existingOrg = await dbClient
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
      'owner_name',
    ])
    .where('ext_clerk_user_id', '=', extClerkUserId)
    .executeTakeFirst()

  if (existingOrg) {
    return { organization: existingOrg, isNew: false }
  }

  const mailchimpSubscriberHash = config.app.isProduction
    ? await mailchimp.subscribeUser({
        email,
      })
    : null

  const newOrganization = await dbClient
    .insertInto('homie.organization')
    .values({
      ext_clerk_user_id: extClerkUserId,
      mailchimp_subscriber_hash: mailchimpSubscriberHash,
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  return { organization: newOrganization, isNew: true }
}
