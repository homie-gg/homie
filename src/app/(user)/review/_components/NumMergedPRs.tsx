'use client'

import { usePullRequests } from '@/app/(user)/review/_components/PullRequestsProvider'

export default function NumMergedPRs() {
  const { pullRequests } = usePullRequests()

  return pullRequests.filter((pr) => pr.merged_at !== null).length
}
