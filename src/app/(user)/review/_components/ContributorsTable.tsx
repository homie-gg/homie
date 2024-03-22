import { dbClient } from '@/lib/db/client'
import { Organization } from '@/lib/db/types'
import DataTable from '@/lib/ui/DataTable'

import { ColumnDef } from '@tanstack/react-table'

export interface Contributor {
  username: string
  prCount: number
}

export const columns: ColumnDef<Contributor>[] = [
  {
    accessorKey: 'username',
    header: 'Github Username',
  },
  {
    accessorKey: 'prCount',
    header: 'PR Count',
  },
]

interface ContributorsTableProps {
  startDate: Date
  endDate: Date
  organization: Organization
}

export default async function ContributorsTable(props: ContributorsTableProps) {
  const { startDate, endDate, organization } = props

  const pullRequests = await dbClient
    .selectFrom('github.pull_request')
    .where('created_at', '>=', startDate)
    .where('created_at', '<=', endDate)
    .where('github.pull_request.organization_id', '=', organization.id)
    .selectAll()
    .execute()

  const contributorCounts: Record<string, number> = {}

  for (const pullRequest of pullRequests) {
    const currentCount = contributorCounts[pullRequest.user_id] ?? 0
    contributorCounts[pullRequest.user_id] = currentCount + 1
  }

  const contributors: Contributor[] = await Promise.all(
    Object.entries(contributorCounts).map(async ([userId, prCount]) => {
      const user = await dbClient
        .selectFrom('github.user')
        .where('id', '=', parseInt(userId))
        .selectAll()
        .executeTakeFirstOrThrow()

      return {
        username: user.username,
        prCount,
      }
    }),
  )

  return <DataTable columns={columns} data={contributors} />
}
