import { dbClient } from '@/database/client'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { redirect } from 'next/navigation'
import InstallAsanaPage from '@/app/(user)/settings/asana/_components/InstallAsanaPage'
import AsanaProjectsList from '@/app/(user)/settings/asana/_components/AsanaProjectsList'

export default async function AsanaSettingsContent() {
  const organization = await getUserOrganization()

  if (!organization) {
    return redirect('/')
  }

  const asanaAppUser = await dbClient
    .selectFrom('asana.app_user')
    .where('organization_id', '=', organization.id)
    .select(['asana_access_token', 'asana_refresh_token'])
    .executeTakeFirst()

  if (!asanaAppUser) {
    return <InstallAsanaPage />
  }

  return (
    <AsanaProjectsList
      organization={organization}
      asanaAppUser={asanaAppUser}
    />
  )
}
