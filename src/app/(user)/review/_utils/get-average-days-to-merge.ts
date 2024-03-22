import { GithubPullRequest } from '@/lib/db/types'
import { differenceInDays } from 'date-fns'

export function getAverageDaysToMerge(pullRequests: GithubPullRequest[]) {
  let totalDaysToMerge = 0
  let numMergedPRs = 0

  for (const pullRequest of pullRequests) {
    if (!pullRequest.merged_at) {
      continue
    }

    const mergedAt = new Date(pullRequest.merged_at)

    const createdAt = new Date(pullRequest.created_at)

    const daysTaken = differenceInDays(mergedAt, createdAt)

    totalDaysToMerge += daysTaken
    numMergedPRs++
  }

  if (!numMergedPRs) {
    return '-'
  }

  const days = Math.round(totalDaysToMerge / numMergedPRs)

  if (days === 0 || days > 1) {
    return `${days} days`
  }

  return '1 day'
}
