import {
  Contributor,
  getContributors,
} from '@/app/(user)/review/_utils/get-contributors'
import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'
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
  pullRequests: PullRequest[]
}

export default async function ContributorsTable(props: ContributorsTableProps) {
  const { pullRequests } = props

  const contributors = getContributors(pullRequests)

  return <DataTable columns={columns} data={contributors} />
}
