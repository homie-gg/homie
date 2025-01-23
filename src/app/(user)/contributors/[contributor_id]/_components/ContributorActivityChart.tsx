import PeriodChart, { PeriodChartData } from '@/lib/ui/PeriodChart'
import { addDays, differenceInDays, subDays } from 'date-fns'
import { dbClient } from '@/database/client'

type ContributorActivityChartProps = {
  contributor: {
    id: number
  }
  startDate: Date
  endDate: Date
}

export default async function ContributorActivityChart(
  props: ContributorActivityChartProps,
) {
  const { contributor, startDate, endDate } = props

  const numDays = differenceInDays(endDate, startDate)

  const days = Array.from(
    {
      length: numDays,
    },
    (_, index) => addDays(startDate, index),
  )

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
            .where('created_at', '>=', subDays(day, days.length))
            .where('created_at', '<=', day)
            .where('contributor_id', '=', contributor.id)
            .execute()
        ).length,
      }
    }),
  )

  return <PeriodChart data={data} />
}
