'use client'

import { getCoreRowModel, useReactTable } from '@tanstack/react-table'
import styles from './ContributorCompletedPullRequests.module.scss'
import ChartCard from '@/app/(user)/_components/ChartCard'
import DataTable from '@/lib/ui/DataTable'

export type ContributorCompletedPullRequestsProps = {
  data: {
    title: string
    estimatedTime: string
    actualTimeTaken: string
  }[]
}

const CompletedPullRequests = ({
  data,
}: ContributorCompletedPullRequestsProps) => {
  const table = useReactTable({
    columns: [
      {
        accessorKey: 'title',
        header: 'Title',
      },
      {
        accessorKey: 'estimatedTime',
        header: 'Estimated Time',
      },
      {
        accessorKey: 'actualTimeTaken',
        header: 'Actual Time Taken',
      },
    ],
    data: data,
    getCoreRowModel: getCoreRowModel(),
  })

  return (
    <ChartCard
      title="Most recent PRs"
      className={styles['chart-card']}
      action={{ label: 'View all', handler: () => {} }}
    >
      <div className={styles.table}>
        <DataTable
          columns={table.getHeaderGroups()}
          data={table.getRowModel().rows}
        />
      </div>
    </ChartCard>
  )
}

export default CompletedPullRequests
