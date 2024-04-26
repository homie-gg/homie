import InstallTrelloPage from '@/app/(user)/settings/trello/_components/InstallTrelloPage'
import { dbClient } from '@/database/client'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { redirect } from 'next/navigation'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { TrelloBoard } from '@/lib/trello/types'
import ConfigureTrelloForm from '@/app/(user)/settings/trello/_components/ConfigureTrelloForm'

export default async function TrelloSettingsContent() {
  const organization = await getUserOrganization()

  if (!organization) {
    return redirect('/')
  }

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .where('organization_id', '=', organization.id)
    .select([
      'id',
      'trello_access_token',
      'ext_trello_done_task_list_id',
      'ext_trello_board_id',
      'ext_trello_new_task_list_id',
    ])
    .executeTakeFirst()

  if (!trelloWorkspace) {
    return <InstallTrelloPage />
  }

  const trelloClient = createTrelloClient(trelloWorkspace.trello_access_token)

  const trelloBoards =
    await trelloClient.get<TrelloBoard[]>('/members/me/boards')

  return (
    <ConfigureTrelloForm
      organization={organization}
      trelloWorkspace={trelloWorkspace}
      trelloBoards={trelloBoards}
    />
  )
}
