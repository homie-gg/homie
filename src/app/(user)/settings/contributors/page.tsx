import ContributorRow from '@/app/(user)/settings/contributors/_components/ContributorRow'
import FetchUsersFailedAlert from '@/app/(user)/settings/contributors/_components/FetchUsersFailedAlert'
import { createSlackClient } from '@/lib/api/slack/create-slack-client'
import { dbClient } from '@/database/client'
import { getSlackUsers } from '@/lib/slack/get-slack-users'
import { Separator } from '@/lib/ui/Separator'
import {
  Table,
  TableBody,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'
import { auth } from '@clerk/nextjs'

interface ContributorsPageProps {}

export default async function ContributorsPage(props: ContributorsPageProps) {
  const {} = props

  const { userId } = auth()

  if (!userId) {
    return null
  }

  const organization = await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'voidpm.organization.id',
    )
    .where('ext_clerk_user_id', '=', userId)
    .select(['slack_access_token', 'voidpm.organization.id'])
    .executeTakeFirst()

  if (!organization) {
    return null
  }
  const slackClient = createSlackClient(organization.slack_access_token)

  const { members: slackMembers = [], ok } = await getSlackUsers({
    slackClient,
  })

  if (!ok) {
    return <FetchUsersFailedAlert />
  }

  const contributors = await dbClient
    .selectFrom('voidpm.contributor')
    .where('organization_id', '=', organization.id)
    .select(['username', 'id', 'ext_slack_member_id'])
    .execute()

  const availableSlackMembers = slackMembers.filter(
    (slackMember) =>
      slackMember.is_bot === false &&
      slackMember.id !== 'USLACKBOT' &&
      (!!slackMember.profile?.display_name || !!slackMember.profile?.real_name), // has name
  )

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-lg font-medium">Contributors</h3>
        <p className="text-sm text-muted-foreground">
          Anybody that has opened a Pull Request
        </p>
      </div>
      <Separator />
      <Table>
        <TableCaption>
          Map users to their Slack profiles for them to be correctly mentioned.
        </TableCaption>
        <TableHeader>
          <TableRow>
            <TableHead>GitHub User</TableHead>
            <TableHead>Slack User</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributors.map((contributor) => (
            <ContributorRow
              key={contributor.id}
              contributor={contributor}
              slackMembers={availableSlackMembers}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
