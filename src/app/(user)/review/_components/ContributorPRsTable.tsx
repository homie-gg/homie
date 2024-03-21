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
  return (
    <TableRow>
      <TableCell className="font-medium">
        {user.value?.username ?? (
          <Skeleton className="w-[100px] h-[16px] rounded-full" />
        )}
      </TableCell>
      <TableCell className="text-right">{prCount}</TableCell>
    </TableRow>
  )
}
