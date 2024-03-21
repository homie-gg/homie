'use client'

import ContributorsTableRow from '@/app/(user)/review/_components/ContributorPRsTable'
import { useContributors } from '@/app/(user)/review/_components/PullRequestsProvider'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'

interface ContributorsTabProps {}

export default function ContributorsTab(props: ContributorsTabProps) {
  const {} = props
  const { contributors } = useContributors()

  const sorted = contributors.sort((a, b) => b.prCount - a.prCount) // Descending

  return (
    <Table>
      <TableCaption>A list of your recent invoices.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[100px]">Github Username</TableHead>
          <TableHead className="text-right">PR Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {sorted.map((contributor) => (
          <ContributorsTableRow
            key={contributor.userId}
            userId={contributor.userId}
            prCount={contributor.prCount}
          />
        ))}
      </TableBody>
    </Table>
  )
}
