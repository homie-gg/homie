import { notFound } from 'next/navigation'
import clsx from 'clsx'
import ContributorHeader from './_components/ContributorHeader'
import ContributorData from './_components/ContributorData'
import ContributorPrPerRepo from './_components/ContributorPrPerRepo'
import CompletedPullRequests from './_components/ContributorCompletedPullRequests'
import TasksTable from '@/app/(user)/tasks/_components/TasksTable'
import styles from './_components/ContributorDetailsPage.module.scss'
import { TaskCategory } from '@/app/(user)/tasks/_components/TaskCategorySelectItem'
import { dbClient } from '@/database/client'
import { Days, daysFilter } from '@/lib/ui/DateSelect/dates'
import ChartCard from '@/lib/ui/ChartCard'
import PeriodChart from '@/lib/ui/PeriodChart'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getSlackUsers } from '@/lib/slack/get-slack-users'
import { endOfDay, startOfDay, subDays } from 'date-fns'
import { getContributorLatestPullRequest } from './_utils/get-contributor-pull-requests'
import { getHoursDiff } from './_utils/get-hours-diff'
import { getContributorTasks } from '@/app/(user)/contributor/[user_id]/_utils/get-contributor-tasks'

const contributorPrPerRepoData = [
  {
    repo: 'Repo 1',
    prCount: 5,
  },
  {
    repo: 'Repo 2',
    prCount: 3,
  },
  {
    repo: 'Repo 3',
    prCount: 2,
  },
  {
    repo: 'Repo 4',
    prCount: 1,
  },
  {
    repo: 'Repo 5',
    prCount: 1,
  },
]

const periodData = [
  {
    day: 'Day 1',
    current: 3,
    previous: 1,
  },
  {
    day: 'Day 2',
    current: 5,
    previous: 3,
  },
  {
    day: 'Day 3',
    current: 11,
    previous: 5,
  },
  {
    day: 'Day 4',
    current: 14,
    previous: 7,
  },
]

interface ContributorDetailsPageProps {
  params: { user_id: string }
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
    searchParams: {
      days: searchParamDays = '7',
      category,
      added_from,
      added_to,
      page,
      search,
      priority,
    },
    params: { user_id: userId },
  } = props

  const days =
    searchParamDays && daysFilter.includes(searchParamDays)
      ? searchParamDays
      : '7'

  const startDate = subDays(new Date(), parseInt(days))
  const endDate = endOfDay(new Date())

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .where('ext_clerk_user_id', '=', userId)
    .select([
      'slack_access_token',
      'ext_clerk_user_id',
      'homie.organization.id',
    ])
    .executeTakeFirst()

  if (!organization) {
    return null
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  const { members: slackMembers = [] } = await getSlackUsers({
    slackClient,
  })

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .innerJoin(
      'homie.organization',
      'homie.organization.id',
      'homie.contributor.organization_id',
    )
    .where('homie.organization.ext_clerk_user_id', '=', userId)
    .select(['username', 'id', 'ext_slack_member_id'])
    .executeTakeFirst()

  if (!contributor) return notFound()

  const slackMember = slackMembers.find(
    ({ id }) => id === contributor?.ext_slack_member_id,
  )

  const isAvailable =
    slackMember?.is_bot === false &&
    slackMember.id !== 'USLACKBOT' &&
    (!!slackMember.profile?.display_name || !!slackMember.profile?.real_name)

  if (!isAvailable) return null

  const contributorTasks = await getContributorTasks({
    organization,
    contributor_id: contributor.id,
    category,
    added_from,
    added_to,
    page,
    search,
    priority,
  })

  const dateFilteredContributorTasks = await getContributorTasks({
    organization,
    contributor_id: contributor.id,
    added_from: startOfDay(startDate).toString(),
    added_to: endDate.toString(),
  })

  const latestPullRequest = await getContributorLatestPullRequest({
    startDate: startOfDay(startDate),
    endDate: endDate,
    organizationId: organization.id,
    contributorId: contributor.id,
  })
  const hoursSinceLastPullRequest =
    latestPullRequest && getHoursDiff(latestPullRequest.created_at)

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <ContributorHeader
          user={{
            id: contributor.id,
            name:
              slackMember?.profile?.real_name ??
              slackMember?.profile?.display_name ??
              '',
            username: contributor?.username ?? '',
            image: '',
          }}
        />
        <ContributorData
          locale={{
            country: '',
            tz: slackMember?.tz,
          }}
          hoursSinceLastPr={hoursSinceLastPullRequest}
          tasksAssigned={dateFilteredContributorTasks.total}
          tasksCompleted={dateFilteredContributorTasks.total_completed_tasks}
        />
        <TasksTable tasks={contributorTasks} />
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ContributorPrPerRepo data={contributorPrPerRepoData} />
            <CompletedPullRequests completedPullRequests={[]} />
          </div>
        </div>
        <div className={styles.section}>
          <div className={styles['section-content']}>
            <ChartCard title="Activity Score">
              <div className={styles['chart-container']}>
                <PeriodChart data={periodData} xOrientation="top" />
              </div>
            </ChartCard>
            <ChartCard title="Impact Score">
              <div className={styles['chart-container']}>
                <PeriodChart data={periodData} xOrientation="top" />
              </div>
            </ChartCard>
          </div>
        </div>
      </div>
    </div>
  )
}
