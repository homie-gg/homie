'use client'

import DataTable from '@/lib/ui/DataTable'
import { ArrowUpDown } from 'lucide-react'
import { Column, ColumnDef, getSortedRowModel } from '@tanstack/react-table'
import { PullRequest } from '@/app/(user)/review/_utils/get-pull-requests'
import { format } from 'date-fns'
import DataTableSortableHeader from '@/lib/ui/DataTableSortableHeader'

export const columns: ColumnDef<PullRequest>[] = [
  {
    accessorKey: 'user_username',
    header: ({ column }: { column: Column<PullRequest> }) => (
      <DataTableSortableHeader column={column}>
        Contributor
      </DataTableSortableHeader>
    ),
  },
  {
    accessorKey: 'repo_name',
    header: ({ column }: { column: Column<PullRequest> }) => {
      return (
        <span
          onClick={() => column.toggleSorting(column.getIsSorted() === 'asc')}
          className="px-0 text-muted-foreground cursor-pointer flex items-center"
        >
          Repo
          <ArrowUpDown className="ml-2 h-4 w-4" />
        </span>
      )
    },
  },
  {
    accessorKey: 'title',
    header: ({ column }: { column: Column<PullRequest> }) => (
      <DataTableSortableHeader column={column}>
        PR Title
      </DataTableSortableHeader>
    ),
  },
  {
    header: ({ column }: { column: Column<PullRequest> }) => (
      <DataTableSortableHeader column={column}>Status</DataTableSortableHeader>
    ),
    id: 'status',
    accessorFn: (row) => {
      if (!row.merged_at && !row.closed_at) {
        return 'Open'
      }

      if (row.merged_at) {
        return 'Merged'
      }

      if (row.closed_at) {
        return 'Closed'
      }

      return '-'
    },
  },
  {
    accessorKey: 'created_at',
    header: ({ column }: { column: Column<PullRequest> }) => (
      <DataTableSortableHeader column={column}>Opened</DataTableSortableHeader>
    ),
    accessorFn: (row) => format(row.created_at, 'LLL dd, y'),
  },

  {
    accessorKey: 'created_at',
    header: ({ column }: { column: Column<PullRequest> }) => (
      <DataTableSortableHeader column={column}>
        Completed
      </DataTableSortableHeader>
    ),
    accessorFn: (row) => {
      if (row.merged_at) {
        return format(row.merged_at, 'LLL dd, y')
      }

      if (row.closed_at) {
        return format(row.closed_at, 'LLL dd, y')
      }
      return '-'
    },
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
