import { dbClient } from '@/database/client'
import { PageProps } from '@/lib/next-js/page-props'
import { GetAccessToken } from '@/lib/slack/get-access-token'
import { auth } from '@clerk/nextjs'
import { redirect } from 'next/navigation'

export default async function SlackSetup(
  props: PageProps<
    {},
    {
      code: string
      state: string
    }
  >,
) {
  const { searchParams } = props

  const { code, state: organization_id } = searchParams

  const { userId } = auth()

  if (!userId) {
    redirect('/')
  }

  const data = await GetAccessToken({ code })

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .where('voidpm.organization.id', '=', parseInt(organization_id))
    .where('ext_clerk_user_id', '=', userId)
    .select('id')
    .executeTakeFirst()

  if (!organization) {
    return redirect('/')
  }

  dbClient
    .insertInto('slack.workspace')
    .values({
      ext_slack_webhook_channel_id: data.incoming_webhook?.channel_id!,
      ext_slack_team_id: data.team?.id!,
      ext_slack_bot_user_id: data.bot_user_id!,
      webhook_url: data.incoming_webhook?.url!,
      organization_id: organization.id,
      slack_access_token: data.access_token!,
    })
    .onConflict((oc) =>
      oc.column('organization_id').doUpdateSet({
        ext_slack_webhook_channel_id: data.incoming_webhook?.channel_id!,
        ext_slack_team_id: data.team?.id!,
        webhook_url: data.incoming_webhook?.url!,
        slack_access_token: data.access_token,
      }),
    )
    .executeTakeFirstOrThrow()

  return redirect('/review')
}
