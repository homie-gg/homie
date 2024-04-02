import { dbClient } from '@/lib/db/client'

export const findOrgWithSlackTeamId = async (teamId: string) => {
  return await dbClient
    .selectFrom('voidpm.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'voidpm.organization.id',
    )
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'voidpm.organization.id',
    )
    .select([
      'ext_gh_install_id',
      'slack_access_token',
      'ext_slack_bot_user_id',
    ])
    .where('ext_slack_team_id', '=', teamId)
    .executeTakeFirst()
}
