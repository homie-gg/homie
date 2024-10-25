'use client'

import ChartCard from '@/lib/ui/ChartCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'
import { getAverageDaysToMerge } from '@/app/(user)/pull_requests/_utils/get-average-days-to-merge'
import styles from './ContributorCompletedPullRequests.module.scss'

type CompletedPullRequestsProps = {
  completedPullRequests: PullRequest[]
}

export default function CompletedPullRequests({
  completedPullRequests,
}: CompletedPullRequestsProps) {
  return (
    <ChartCard
      title="Most recent PRs"
      className={styles['chart-card']}
      action={{ label: 'View all', handler: () => {} }}
    >
      <div className={styles.table}>
        <Table>
          <TableHeader>
            <TableRow>
              <TableCell>Title</TableCell>
              <TableCell>Estimated Time</TableCell>
              <TableCell>Actual Time Taken</TableCell>
            </TableRow>
          </TableHeader>
          <TableBody>
            {completedPullRequests.map((pullRequest) => {
              const averageDaysToMerge = getAverageDaysToMerge([pullRequest])

              return (
                <TableRow key={pullRequest.id}>
                  <TableCell>{pullRequest.title}</TableCell>
                  <TableCell>12 hours</TableCell>
                  <TableCell>{averageDaysToMerge}</TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}
