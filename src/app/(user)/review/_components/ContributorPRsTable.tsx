import { useGithubUser } from '@/lib/api/github/use-github-user'
import { Skeleton } from '@/lib/ui/Skeleton'
import { TableCell, TableRow } from '@/lib/ui/Table'

interface ContributorsPRsTableProps {
  userId: number
  prCount: number
}

export default function ContributorsTableRow(props: ContributorsPRsTableProps) {
  const { userId, prCount } = props

  const user = useGithubUser({ userId })

  if (!user.value) {
    return (
      <TableRow className="w-100">
        <TableCell className="font-medium w-100">
          <Skeleton className="w-48 h-[16px] rounded" />
        </TableCell>
        <TableCell className="text-right w-0">
          <Skeleton className="w-16 h-[16px] rounded" />
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium w-100">{user.value.username}</TableCell>
      <TableCell className="text-right">{prCount}</TableCell>
    </TableRow>
  )
}
