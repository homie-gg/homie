import { GithubUser } from '@/app/api/github/users/[id]/route'
import { api } from '@/lib/http/client/api'
import { http } from '@/lib/http/client/http'
import { useEffect, useState } from 'react'

interface GithubUserNameProps {
  userId: string
}

export default function GithubUsername(props: GithubUserNameProps) {
  const { userId } = props
  const [name, setName] = useState<string | null>(null)

  useEffect(() => {
    http
      .get<{
        user: GithubUser
      }>(api(`/github/users/${userId}`))
      .then((data) => {
        setName(data.user.username)
      })
  }, [userId])

  return name
}
