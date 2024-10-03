import { dbClient } from '@/database/client'
import { writeCode } from '@/queue/jobs/write-code'
import crypto from 'node:crypto'

export default async function TestPage() {
  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .select([
      'homie.organization.id',
      'ext_gh_install_id',
      'slack_access_token',
      'ext_slack_webhook_channel_id',
    ])
    .executeTakeFirstOrThrow()

  await writeCode.dispatch(
    {
      organization,
      instructions: `{
      update navbar color to blue
    }`,
      github_repo_id: 1,
      slack_target_message_ts: '',
      slack_channel_id: organization.ext_slack_webhook_channel_id,
    },
    {
      attempts: 1,
    },
  )
  return <div>hello</div>
}
