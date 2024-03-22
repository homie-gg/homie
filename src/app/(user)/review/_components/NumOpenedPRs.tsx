'use client'

import { usePullRequests } from '@/app/(user)/review/_components/PullRequestsProvider'

export default function NumOpenedPRs() {
  const { pullRequests } = usePullRequests()

  return pullRequests.length
}
