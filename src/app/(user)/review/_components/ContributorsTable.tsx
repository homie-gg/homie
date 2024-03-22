import {
  Contributor,
  getContributors,
} from '@/app/(user)/review/_utils/get-contributors'
import { GithubPullRequest } from '@/lib/db/types'
import DataTable from '@/lib/ui/DataTable'

import { ColumnDef } from '@tanstack/react-table'

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
  pullRequests: GithubPullRequest[]
}

export default async function ContributorsTable(props: ContributorsTableProps) {
  const { pullRequests } = props

  const contributors = await getContributors(pullRequests)

  return <DataTable columns={columns} data={contributors} />
}
