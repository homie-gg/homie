import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { PageProps } from '@/lib/next-js/page-props'
import { redirect } from 'next/navigation'
import { http } from '@/lib/http/client/http'
import { dbClient } from '@/database/client'
import { AsanaOAuthTokenResponse } from '@/lib/asana/types'
import { dispatch } from '@/queue/default-queue'

type AsanaPageProps = PageProps<
  {},
  {
    code: string
  }
>

export default async function AsanaSetupPage(props: AsanaPageProps) {
  const { searchParams } = props

  const organization = await getUserOrganization()

  if (!organization) {
    redirect('/settings/asana?failed=true')
    return
  }

  const data = new FormData()
  data.append('grant_type', 'authorization_code')
  data.append('client_id', process.env.ASANA_CLIENT_ID!)
  data.append('client_secret', process.env.ASANA_CLIENT_SECRET!)
  data.append('redirect_uri', `${process.env.NEXT_PUBLIC_APP_URL}/asana/setup`)
  data.append('code', searchParams.code)

  const { access_token, refresh_token } =
    await http.post<AsanaOAuthTokenResponse>(
      'https://app.asana.com/-/oauth_token',
      data,
    )

  await dbClient
    .insertInto('asana.app_user')
    .values({
      asana_refresh_token: refresh_token,
      asana_access_token: access_token,
      organization_id: organization.id,
    })
    .onConflict((oc) =>
      oc.column('organization_id').doUpdateSet({
        asana_refresh_token: refresh_token,
        asana_access_token: access_token,
      }),
    )
    .executeTakeFirstOrThrow()

  await dispatch('import_asana_projects', {
    organization: {
      id: organization.id,
      asana_access_token: access_token,
    },
  })

  return redirect('/settings/asana')
}
