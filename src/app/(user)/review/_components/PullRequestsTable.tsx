'use client'

import { Button } from '@/lib/ui/Button'
import DataTable from '@/lib/ui/DataTable'
import { ArrowUpDown } from 'lucide-react'
import { Column, ColumnDef, getSortedRowModel } from '@tanstack/react-table'
import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'

export const columns: ColumnDef<PullRequest>[] = [
  {
    accessorKey: 'username',
    header: ({ column }: { column: Column<PullRequest> }) => {
      return (
        <Button
          variant="ghost"
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
        >
          Contributor
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </Button>
      )
    },
  },
  {
    accessorKey: 'repo',
    header: 'Repo',
  },
  {
    accessorKey: 'title',
    header: 'PR Title',
  },
]

interface ContributorsTableProps {
  pullRequests: PullRequest[]
}

export default function PullRequestsTable(props: ContributorsTableProps) {
  const { pullRequests } = props

  return (
    <DataTable
      columns={columns}
      data={pullRequests}
      options={{
        getSortedRowModel: getSortedRowModel(),
        initialState: {
          sorting: [
            {
              id: 'username',
              desc: false,
            },
          ],
        },
      }}
    />
  )
}
