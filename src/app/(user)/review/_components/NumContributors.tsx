'use client'

import { usePullRequests } from '@/app/(user)/review/_components/PullRequestsProvider'

export default function NumContributors() {
  const { pullRequests } = usePullRequests()

  const contributors: Record<string, number> = {}

  for (const pullRequest of pullRequests) {
    contributors[pullRequest.user_id] = 1
  }

  return Object.keys(contributors).length
}
