import ContributorPeriodChart, {
  PeriodChartData,
} from './ContributorPeriodChart'
import styles from './ContributorActivityChart.module.scss'

type ContributorActivityChartProps = {
  data: PeriodChartData
}

const ContributorActivityChart = ({ data }: ContributorActivityChartProps) => {
  return (
    <div className={styles.container}>
      <p className={styles.label}>Activity Score</p>
      <ContributorPeriodChart data={data} />
    </div>
  )
}

export default ContributorActivityChart
