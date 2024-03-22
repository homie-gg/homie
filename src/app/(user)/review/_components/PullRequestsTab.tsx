import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'

interface PullRequestsTabProps {}

export default function PullRequestsTab(props: PullRequestsTabProps) {
  const {} = props

  return (
    <Table>
      <TableCaption>A list of all pull requests opened.</TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead className="w-2/12">Contributor</TableHead>
          <TableHead className="w-2/12">Repo</TableHead>
          <TableHead className="w-8/12">PR Title</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody></TableBody>
    </Table>
  )
}
