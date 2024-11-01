import { auth } from '@clerk/nextjs'
import clsx from 'clsx'
import ContributorsFilters from './_components/ContributorsFlters'
import ContributorsData from './_components/ContributorsData'
import styles from './_components/ContributorsPage.module.scss'
import PageHeader from '@/app/(user)/_components/PageHeader'
import PageTitle from '@/app/(user)/_components/PageTitle'
import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { Days, daysFilter } from '@/lib/ui/DateSelect/dates'
import { getSlackUsers } from '@/lib/slack/get-slack-users'
import { getSlackDisplayName } from '@/lib/slack/get-slack-display-name'
import { contributorCategories } from './_components/ContributorCategorySelectItem'

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
  const slackClient = createSlackClient(organization.slack_access_token)

  const { members: slackMembers = [], ok } = await getSlackUsers({
    slackClient,
  })

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .select(['username', 'id', 'ext_slack_member_id'])
    .execute()

  const availableSlackMembers = slackMembers
    .filter(
      (slackMember) =>
        slackMember.is_bot === false &&
        slackMember.id !== 'USLACKBOT' &&
        (!!slackMember.profile?.display_name ||
          !!slackMember.profile?.real_name), // has name
    )
    .sort((a, b) =>
      getSlackDisplayName(a).localeCompare(getSlackDisplayName(b)),
    )

  const contributorsData = await Promise.all(
    contributors.map(async (contributor) => {
      const slackMember = availableSlackMembers.find(
        (member) => member.id === contributor.ext_slack_member_id,
      )

      const contributorTasks =
        (await dbClient
          .selectFrom('homie.contributor_task')
          .where('contributor_id', '=', contributor.id)
          .select(['id'])
          .execute()) ?? []
      const tasksCount = contributorTasks.length

      return {
        id: contributor.id,
        username: contributor.username,
        category:
          tasksCount < 1
            ? contributorCategories['2']
            : tasksCount < 4
              ? contributorCategories['1']
              : contributorCategories['0'],
        name:
          slackMember?.profile?.real_name ??
          slackMember?.profile?.display_name ??
          contributor.username,
        active: true,
        locale: {
          country: slackMember?.locale,
          tz: slackMember?.tz,
        },
        hoursSinceLastPr: 2,
        tasksAssignedCount: contributorTasks.length,
      }
    }),
  )

  return (
    <div className={styles.root}>
      <div className={clsx('container', styles.container)}>
        <PageHeader>
          <PageTitle>Contributors</PageTitle>
        </PageHeader>
        <div className={styles.content}>
          <ContributorsFilters days={days} />
          <ContributorsData contributorsData={contributorsData} />
        </div>
      </div>
    </div>
  )
}
