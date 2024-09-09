import { createSlackClient } from '@/lib/slack/create-slack-client'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { summarizeTask } from '@/lib/ai/summarize-task'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { dbClient } from '@/database/client'
import { getConversation } from '@/lib/slack/get-conversation'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'
import { createAsanaClient } from '@/lib/asana/create-asana-client'
import { marked } from 'marked'
import { createJob } from '@/queue/create-job'

export const createAsanaTaskFromSlack = createJob({
  id: 'create_asana_task_from_slack',
  handle: async (payload: {
    team_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
    project_id: string | null
  }) => {
    const { team_id, target_message_ts, channel_id, response_url, project_id } =
      payload

    if (!project_id) {
      await http.post(response_url, {
        text: `Error creating task; was an Asana project selected?`,
      })

      return
    }

    const organization = await findOrgWithSlackTeamId(team_id)
    if (!organization) {
      await http.post(response_url, {
        text: `Error creating issue. Was homie App installed correctly to this workspace?`,
      })

      return
    }

    const project = await dbClient
      .selectFrom('asana.project')
      .where('id', '=', parseInt(project_id))
      .where('organization_id', '=', organization.id)
      .select(['ext_asana_project_id'])
      .executeTakeFirst()

    if (!project) {
      await http.post(response_url, {
        text: `Error creating task. Missing project.`,
      })

      return
    }

    const slackClient = createSlackClient(organization.slack_access_token)

    if (await getIsOverPlanContributorLimit({ organization })) {
      await slackClient.post('chat.postMessage', {
        channel: channel_id,
        thread_ts: target_message_ts,
        text: getOverContributorLimitMessage(),
      })

      return
    }

    const asanaAppUser = await dbClient
      .selectFrom('asana.app_user')
      .select(['asana_access_token'])
      .where('organization_id', '=', organization.id)
      .executeTakeFirst()

    if (!asanaAppUser) {
      await http.post(response_url, {
        text: `Asana has not been installed to this organization. Please login to homie, and go to 'Settings > Asana' to install.`,
      })
      return
    }

    const messages = await getConversation({
      slackClient,
      channelID: channel_id,
      messageTS: target_message_ts,
      includeBotReplies: false,
    })

    if (messages.length === 0) {
      return
    }

    const initialMessage = 'text' in messages[0] ? messages[0].text : 'Message'

    const slackMessageUrl = await getMessageLink({
      channelID: channel_id,
      messageTS: messages[0].ts,
      slackClient,
    })

    const data = await summarizeTask({ messages })
    if (!data) {
      await http.post(response_url, {
        text: `Error creating task for: ${initialMessage}`,
      })
      return
    }

    const { task: issue, requirements } = data

    const issueDescription = `**Slack Message:**\n\n[${initialMessage}](${slackMessageUrl})\n\n**Requirements:**\n\n${requirements}`

    const asana = createAsanaClient(asanaAppUser.asana_access_token)

    const { data: task } = await asana.post<any>('/tasks', {
      data: {
        name: issue,
        resource_subtype: 'default_task',
        projects: [project.ext_asana_project_id],
        html_notes: `<body>${marked.parse(issueDescription)}</body>`
          .replaceAll('<p>', '')
          .replaceAll('</p>', ''),
      },
    })

    await slackClient.post('chat.postMessage', {
      channel: channel_id,
      blocks: [
        {
          type: 'rich_text',
          elements: [
            {
              type: 'rich_text_quote',
              elements: [
                {
                  type: 'text',
                  text: 'Asana task created:',
                  style: {
                    bold: true,
                  },
                },
                {
                  type: 'text',
                  text: '\n',
                },
                {
                  type: 'link',
                  url: task.permalink_url,
                  text: task.name,
                },
                {
                  type: 'text',
                  text: '\n',
                },
                {
                  type: 'text',
                  text: task.notes,
                },
              ],
            },
          ],
        },
      ],
    })
  },
})
