import TrelloInstaller from '@/app/trello/setup/_components/TrelloInstaller'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { redirect } from 'next/navigation'

export default async function TrelloSetup() {
  const organization = await getUserOrganization()

  if (!organization) {
    redirect('/settings/trello?failed=true')
    return
  }

  return <TrelloInstaller organization={organization} />
}
