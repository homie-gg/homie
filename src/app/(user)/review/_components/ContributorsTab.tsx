import ContributorsTableRows from '@/app/(user)/review/_components/ContributorsTableRows'
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

  return (
    <Table>
      <TableCaption>
        A list of Github contributors who have opened a PR.
      </TableCaption>
      <TableHeader>
        <TableRow>
          <TableHead>Github Username</TableHead>
          <TableHead className="text-right w-[200px]">PR Count</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        <ContributorsTableRows />
      </TableBody>
    </Table>
  )
}
