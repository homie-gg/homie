'use client'

import ChartCard from '@/lib/ui/ChartCard'
import PieChart, { PieChartProps } from '@/lib/ui/PieChart'
type ContributorPullRequetsDistributionProps = {
  data: PieChartProps['data']
}

export default function ContributorPullRequestsDistribution(
  props: ContributorPullRequetsDistributionProps,
) {
  const { data } = props

  return (
    <ChartCard title="PR Contribution per Repository">
      <PieChart data={data} />
    </ChartCard>
  )
}
