import { useGithubUser } from '@/lib/api/github/use-github-user'
import { Skeleton } from '@/lib/ui/Skeleton'
import { TableCell, TableRow } from '@/lib/ui/Table'

interface ContributorsTableSingleRowProps {
  userId: number
  prCount: number
}

export default function ContributorsTableSingleRow(
  props: ContributorsTableSingleRowProps,
) {
  const { userId, prCount } = props

  const user = useGithubUser({ userId })

  if (!user.value) {
    return (
      <TableRow>
        <TableCell className="font-medium">
          <Skeleton className="w-48 h-[16px] rounded" />
        </TableCell>
        <TableCell>
          <Skeleton className="w-16 h-[16px] rounded" />
        </TableCell>
      </TableRow>
    )
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{user.value.username}</TableCell>
      <TableCell className="text-right">{prCount}</TableCell>
    </TableRow>
  )
}
