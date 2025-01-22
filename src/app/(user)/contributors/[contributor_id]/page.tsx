import { notFound } from 'next/navigation'
import clsx from 'clsx'
import ContributorHeader from '@/app/(user)/contributors/[contributor_id]/_components/ContributorHeader'
import ContributorMetrics from '@/app/(user)/contributors/[contributor_id]/_components/ContributorMetrics'
import ContributorPullRequestsDistribution from '@/app/(user)/contributors/[contributor_id]/_components/ContributorPullRequestsDistribution'
import ContributorRecentPullRequests from '@/app/(user)/contributors/[contributor_id]/_components/ContributorRecentPullRequests'
import styles from './_components/ContributorDetailsPage.module.scss'
import { TaskCategory } from '@/app/(user)/tasks/_components/TaskCategorySelectItem'
import { dbClient } from '@/database/client'
import { Days, daysFilter } from '@/lib/ui/DateSelect/dates'
import ChartCard from '@/lib/ui/ChartCard'
import { differenceInHours, endOfDay, startOfDay, subDays } from 'date-fns'
import { getContributorRecentPullRequests } from '@/app/(user)/contributors/[contributor_id]/_utils/get-contributor-recent-pull-requests'
import { getContributorDetails } from '@/app/(user)/contributors/[contributor_id]/_utils/get-contributor-details'
import { getContributorPullRequestsDistribution } from '@/app/(user)/contributors/[contributor_id]/_utils/get-contributor-pull-requests-distribution'
import { getContributorTaskCounts } from '@/app/(user)/contributors/[contributor_id]/_utils/get-contributor-task-counts'
import ContributorActivityChart from '@/app/(user)/contributors/[contributor_id]/_components/ContributorActivityChart'

interface ContributorDetailsPageProps {
  params: { contributor_id: string }
  searchParams: {
    days?: Days
    category?: TaskCategory
    added_from?: string
    added_to?: string
    page?: string
    search?: string
    priority?: string
  }
}

export default async function ContributorDetailsPage(
  props: ContributorDetailsPageProps,
) {
  const {
    searchParams: { days: searchParamDays = '7' },
    params: { contributor_id: contributorId },
  } = props

  const days =
    searchParamDays && daysFilter.includes(searchParamDays)
      ? parseInt(searchParamDays)
      : 7

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .where('ext_clerk_user_id', '=', contributorId)
    .select([
      'slack_access_token',
      'ext_clerk_user_id',
      'homie.organization.id',
    ])
    .executeTakeFirst()

  if (!organization) {
    return notFound()
  }

  const details = await getContributorDetails({
    organization,
    contributorId,
    days,
  })

  if (!details) {
    return notFound()
  }

  const { contributor } = details

  const startDate = startOfDay(subDays(new Date(), days + 1))
  const endDate = endOfDay(subDays(new Date(), 1))

  const pullRequestsDistribution = await getContributorPullRequestsDistribution(
    {
      contributor,
      organization,
      startDate,
      endDate,
    },
  )

  const taskCounts = await getContributorTaskCounts({
    contributor,
    organization,
    startDate,
    endDate,
  })

  const recentPullRequests = await getContributorRecentPullRequests({
    startDate,
    endDate,
    organization,
    contributor,
  })
  const hoursSinceLastPullRequest = recentPullRequests[0]
    ? Math.round(
        differenceInHours(
          new Date(),
          new Date(recentPullRequests[0].created_at),
        ),
      )
    : 0

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <ContributorHeader
          user={{
            id: details.contributor.id,
            name:
              details.slackMember?.real_name ?? details.contributor.username,
            username: details.slackMember?.real_name
              ? details.contributor.username
              : '-',
            image: details.slackMember?.image_192 ?? '',
          }}
        />
        <ContributorMetrics
          timezone={details.slackMember?.tz}
          hoursSinceLastPr={hoursSinceLastPullRequest}
          tasksAssigned={taskCounts.num_assigned}
          tasksCompleted={taskCounts.num_completed}
        />
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ContributorPullRequestsDistribution
              data={pullRequestsDistribution}
            />
            <ChartCard title="Activity Score">
              <div className={styles['chart-container']}>
                <ContributorActivityChart
                  contributor={contributor}
                  startDate={startDate}
                  endDate={endDate}
                />
              </div>
            </ChartCard>
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ContributorRecentPullRequests pullRequests={recentPullRequests} />
          </div>
        </div>
      </div>
    </div>
  )
}
