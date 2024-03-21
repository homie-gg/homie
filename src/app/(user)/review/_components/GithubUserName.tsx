import { useGithubUser } from '@/lib/api/github/use-github-user'
import { Skeleton } from '@/lib/ui/Skeleton'

interface GithubUserNameProps {
  userId: number
}

export default function GithubUsername(props: GithubUserNameProps) {
  const { userId } = props
  const user = useGithubUser({ userId })
  return (
    user.value?.username ?? (
      <Skeleton className="w-[100px] h-[16px] rounded-full" />
    )
  )
}
