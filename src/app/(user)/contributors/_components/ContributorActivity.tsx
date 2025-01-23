import styles from './ContributorActivity.module.scss'
import { subDays } from 'date-fns'
import ContributorActivityChart from '@/app/(user)/contributors/[contributor_id]/_components/ContributorActivityChart'

type ContributorActivityProps = {
  contributor: {
    id: number
  }
}

export default async function ContributorActivity(
  props: ContributorActivityProps,
) {
  const { contributor } = props

  return (
    <div className={styles.container}>
      <p className={styles.label}>Activity Score</p>
      <ContributorActivityChart
        contributor={contributor}
        startDate={subDays(new Date(), 6)}
        endDate={new Date()}
      />
    </div>
  )
}
