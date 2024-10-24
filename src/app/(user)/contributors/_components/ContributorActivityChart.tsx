import PeriodChart, { PeriodChartData } from '@/lib/ui/PeriodChart'
import styles from './ContributorActivityChart.module.scss'

type ContributorActivityChartProps = {
  data: PeriodChartData
}

export default function ContributorActivityChart({
  data,
}: ContributorActivityChartProps) {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Activity Score</p>
      <PeriodChart data={data} />
    </div>
  )
}
