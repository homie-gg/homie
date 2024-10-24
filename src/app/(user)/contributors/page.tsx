import clsx from 'clsx'
import { getUserOrganization } from '@/lib/auth/get-user-organization'
import { Days, daysFilter } from '@/app/(user)/_utils/dates'
import ContributorsFilters from './_components/ContributorsFlters'
import ContributorsData from './_components/ContributorsData'
import styles from './_components/ContributorsPage.module.scss'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'

interface ContributorsPageProps {
  searchParams: {
    days?: Days
  }
}

export default async function ContributorsPage(props: ContributorsPageProps) {
  const { searchParams } = props

  const days =
    searchParams.days && daysFilter.includes(searchParams.days)
      ? searchParams.days
      : '7'

  const organization = await getUserOrganization()
  if (!organization) {
    return
  }

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Contributors</PageTitle>
        </PageHeader>
        <div className={styles.content}>
          <ContributorsFilters days={days} />
          <ContributorsData />
        </div>
      </div>
    </div>
  )
}
