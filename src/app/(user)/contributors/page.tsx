import { auth } from '@clerk/nextjs'
import clsx from 'clsx'
import ContributorsFilters from '@/app/(user)/contributors/_components/ContributorsFilters'
import ContributorsGrid from '@/app/(user)/contributors/_components/ContributorsGrid'
import styles from './_components/ContributorsPage.module.scss'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import { dbClient } from '@/database/client'
import { Days, daysFilter } from '@/lib/ui/DateSelect/dates'
import { getContributors } from '@/app/(user)/contributors/_utils/get-contributors'

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

  const { userId } = auth()

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .where('ext_clerk_user_id', '=', userId)
    .select(['slack_access_token', 'homie.organization.id'])
    .executeTakeFirst()

  if (!organization) {
    return null
  }

  const contributors = await getContributors({
    organization,
  })

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Contributors</PageTitle>
        </PageHeader>
        <div className={styles.content}>
          <ContributorsFilters days={days} />
          <ContributorsGrid contributors={contributors} />
        </div>
      </div>
    </div>
  )
}
