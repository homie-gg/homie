'use client'

import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'
import PieChart from '@/lib/ui/PieChart'
import ChartCard from '@/lib/ui/ChartCard'

export const prPerRepoData = [
  {
    label: 'Repo 1',
    count: 40,
  },
  {
    label: 'Repo 2',
    count: 20,
  },
  {
    label: 'Repo 3',
    count: 15,
  },
  {
    label: 'Repo 4',
    count: 25,
  },
]

const emptyData = [
  {
    label: 'None',
    count: 100,
  },
]

interface PullRequestsDistributionsChartsProps {
  pullRequests: PullRequest[]
}

export default function PullRequestsDistributionsChart(
  props: PullRequestsDistributionsChartsProps,
) {
  const { pullRequests } = props

  const repoCounts: Record<string, number> = {}
  for (const pullRequest of pullRequests) {
    const repo = pullRequest.github_repo_name ?? pullRequest.gitlab_project_name
    if (!repo) {
      continue
    }

    const existingCount = repoCounts[repo] ?? 0
    repoCounts[repo] = existingCount + 1
  }

  const data = Object.entries(repoCounts).map(([repo, count]) => ({
    label: repo,
    count,
  }))

  return (
    <ChartCard title="Repository Contribution">
      <PieChart data={data.length > 0 ? data : emptyData} />
    </ChartCard>
  )
}
