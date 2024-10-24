'use client'

import ChartCard from '@/lib/ui/ChartCard'
import PieChart from '@/lib/ui/PieChart'

type ContributorPrPerRepoProps = {
  data: {
    repo: string
    prCount: number
  }[]
}

export default function ContributorPrPerRepo({
  data,
}: ContributorPrPerRepoProps) {
  return (
    <ChartCard title="PR Contribution per Repository">
      <PieChart
        data={data.map(({ repo, prCount: pullRequestCount }) => ({
          label: repo,
          count: pullRequestCount,
        }))}
      />
    </ChartCard>
  )
}
