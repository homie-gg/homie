'use client'

import ChartCard from '@/lib/ui/ChartCard'
import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'
import styles from './ContributorRecentPullRequests.module.scss'
import { GetContributorRecentPullRequestsData } from '@/app/(user)/contributors/[contributor_id]/_utils/get-contributor-recent-pull-requests'

type ContributorRecentPullRequestsProps = {
  pullRequests: GetContributorRecentPullRequestsData
}

export default function ContributorRecentPullRequests(
  props: ContributorRecentPullRequestsProps,
) {
  const { pullRequests } = props

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
            </TableRow>
          </TableHeader>
          <TableBody>
            {pullRequests.map((pullRequest) => (
              <TableRow key={pullRequest.id}>
                <TableCell>{pullRequest.title}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </ChartCard>
  )
}
