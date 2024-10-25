import { dbClient } from '@/database/client'

export const findOrgWithSlackTeamId = async (teamId: string) => {
  return await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'gitlab.app_user',
      'gitlab.app_user.organization_id',
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
    .select([
      'homie.organization.id',
      'ext_gh_install_id',
      'gitlab.app_user.gitlab_access_token',
      'trello_access_token',
      'ext_trello_done_task_list_id',
      'ext_trello_new_task_list_id',
      'slack_access_token',
      'ext_slack_bot_user_id',
      'has_unlimited_usage',
      'is_persona_enabled',
      'persona_affection_level',
      'persona_emoji_level',
      'persona_g_level',
      'persona_positivity_level',
      'asana_access_token',
    ])
    .where('ext_slack_team_id', '=', teamId)
    .executeTakeFirst()
}
