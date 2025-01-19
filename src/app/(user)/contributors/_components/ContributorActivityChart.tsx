import PeriodChart, { PeriodChartData } from '@/lib/ui/PeriodChart'
import styles from './ContributorActivityChart.module.scss'
import { GetContributorsData } from '@/app/(user)/contributors/_utils/get-contributors'
import { addDays, subDays } from 'date-fns'
import { dbClient } from '@/database/client'

type ContributorActivityChartProps = {
  contributor: GetContributorsData[number]
}

export default async function ContributorActivityChart(
  props: ContributorActivityChartProps,
) {
  const { contributor } = props

  const days = [
    subDays(new Date(), 6),
    subDays(new Date(), 5),
    subDays(new Date(), 4),
    subDays(new Date(), 3),
    subDays(new Date(), 2),
    subDays(new Date(), 1),
    new Date(),
  ]

  const data: PeriodChartData = await Promise.all(
    days.map(async (day, index) => {
      return {
        day: `Day ${index + 1}`,
        current: (
          await dbClient
            .selectFrom('homie.pull_request')
            .where('created_at', '>=', day)
            .where('created_at', '<=', addDays(day, 1))
            .where('contributor_id', '=', contributor.id)
            .execute()
        ).length,
        previous: (
          await dbClient
            .selectFrom('homie.pull_request')
            .where('created_at', '>=', subDays(day, 7))
            .where('created_at', '<=', day)
            .where('contributor_id', '=', contributor.id)
            .execute()
        ).length,
      }
    }),
  )

  return (
    <div className={styles.container}>
      <p className={styles.label}>Activity Score</p>
      <PeriodChart data={data} />
    </div>
  )
}
