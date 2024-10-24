import PeriodChart, {
  PeriodChartData,
} from '@/app/(user)/_components/PeriodChart'
import styles from './ContributorActivityChart.module.scss'

type ContributorActivityChartProps = {
  data: PeriodChartData
}

const ContributorActivityChart = ({ data }: ContributorActivityChartProps) => {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Activity Score</p>
      <PeriodChart data={data} />
    </div>
  )
}

export default ContributorActivityChart
