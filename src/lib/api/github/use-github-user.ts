import { GithubUser } from '@/app/api/github/users/[id]/route'
import { api } from '@/lib/http/client/api'
import { http } from '@/lib/http/client/http'
import { useAsync } from 'react-use'

interface UseGithubUserParams {
  userId: number
}
export function useGithubUser(params: UseGithubUserParams) {
  const { userId } = params

  return useAsync(async () => {
    const res = await http.get<{
      user: GithubUser
    }>(api(`/github/users/${userId}`))
    return res.user
  }, [userId])
}
