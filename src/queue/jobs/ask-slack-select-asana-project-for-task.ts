import { createSlackClient } from '@/lib/slack/create-slack-client'
import { AskSlackSelectAsanaProjectForTask } from '@/queue/jobs'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { dbClient } from '@/database/client'
import { ModalView } from '@slack/bolt'
import { createJob } from '@/queue/create-job'

export type CreateAsanaTaskSelectedRepoMetadata = {
  team_id: string
  channel_id: string
  target_message_ts: string
  response_url: string
}

export const askSlackSelectAsanaProjectForTask = createJob({
  id: 'ask_slack_select_asana_project_for_task',
  handle: async (payload: {
    team_id: string
    trigger_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
  }) => {
    const { team_id, target_message_ts, channel_id, response_url, trigger_id } =
      payload

    const organization = await findOrgWithSlackTeamId(team_id)

    if (!organization) {
      await http.post(response_url, {
        text: `Error creating task. Was homie App installed correctly to this workspace?`,
      })

      return
    }

    const projects = await dbClient
      .selectFrom('asana.project')
      .where('organization_id', '=', organization.id)
      .where('enabled', '=', true)
      .select(['id', 'name'])
      .execute()

    const metadata: CreateAsanaTaskSelectedRepoMetadata = {
      team_id,
      channel_id,
      target_message_ts,
      response_url,
    }

    const modal: ModalView = {
      type: 'modal',
      title: {
        type: 'plain_text',
        text: 'Select an Asana Project',
      },
      callback_id: 'asana_task_create:selected_project',
      blocks: [
        {
          block_id: `select_project_block`,
          type: 'input',
          label: {
            type: 'plain_text',
            text: 'Project',
            emoji: true,
          },
          element: {
            action_id: 'project_id',
            type: 'static_select',
            placeholder: {
              type: 'plain_text',
              text: 'Pick one',
              emoji: true,
            },
            options: projects.map((project) => ({
              text: {
                type: 'plain_text',
                text: project.name,
              },
              value: project.id.toString(),
            })),
          },
        },
      ],
      private_metadata: JSON.stringify(metadata),
      submit: {
        type: 'plain_text',
        text: 'Create Task',
      },
      close: {
        type: 'plain_text',
        text: 'Cancel',
      },
    }

    const slackClient = createSlackClient(organization.slack_access_token)

    await slackClient.post('views.open', {
      trigger_id,
      view: modal,
    })
  },
})
