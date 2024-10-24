'use client'

import ChartCard from '@/app/(user)/_components/ChartCard'
import PieChart from '@/lib/ui/PieChart'

type ContributorPrPerRepoProps = {
  data: {
    repo: string
    prCount: number
  }[]
}

const ContributorPrPerRepo = ({ data }: ContributorPrPerRepoProps) => {
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

export default ContributorPrPerRepo
