import ContributorRow from '@/app/(user)/settings/contributors/_components/ContributorRow'
import FetchUsersFailedAlert from '@/app/(user)/settings/contributors/_components/FetchUsersFailedAlert'
import { createSlackClient } from '@/lib/slack/create-slack-client'
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
import { getTrelloBoardMembers } from '@/lib/trello/get-trello-members'
import { getAsanaUsers } from '@/lib/asana/get-asana-users'
import { getSlackDisplayName } from '@/lib/slack/get-slack-display-name'

interface ContributorsPageProps {}

export default async function ContributorsPage(props: ContributorsPageProps) {
  const {} = props

  const { userId } = auth()

  if (!userId) {
    return null
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'asana.app_user',
      'asana.app_user.organization_id',
      'homie.organization.id',
    )
    .where('ext_clerk_user_id', '=', userId)
    .select([
      'slack_access_token',
      'homie.organization.id',
      'trello_access_token',
      'ext_trello_board_id',
      'asana_access_token',
    ])
    .executeTakeFirst()

  if (!organization) {
    return null
  }
  const slackClient = createSlackClient(organization.slack_access_token)

  const { members: slackMembers = [], ok } = await getSlackUsers({
    slackClient,
  })

  const trelloMembers =
    organization.ext_trello_board_id && organization.trello_access_token
      ? await getTrelloBoardMembers({
          boardId: organization.ext_trello_board_id,
          accessToken: organization.trello_access_token,
        })
      : null

  const asanaUsers = organization.asana_access_token
    ? await getAsanaUsers({
        asanaAccessToken: organization.asana_access_token,
      })
    : null

  if (!ok) {
    return <FetchUsersFailedAlert />
  }

  const contributors = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .select([
      'username',
      'id',
      'ext_slack_member_id',
      'ext_trello_member_id',
      'ext_asana_user_id',
    ])
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
            {trelloMembers && <TableHead>Trello Member</TableHead>}
            {asanaUsers && <TableHead>Asana User</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {contributors.map((contributor) => (
            <ContributorRow
              key={contributor.id}
              contributor={contributor}
              slackMembers={availableSlackMembers}
              trelloMembers={trelloMembers}
              asanaUsers={asanaUsers}
            />
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
