import { createSlackClient } from '@/lib/slack/create-slack-client'
import { Conversation, TextMessageEvent } from '@/lib/slack/types'
import { CreateTrelloTaskFromSlack } from '@/queue/jobs'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { getAllTextMessages } from '@/lib/slack/get-all-text-messages'
import { summarizeTask } from '@/lib/ai/summarize-task'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/get-org-with-slack-team-id'
import { dbClient } from '@/database/client'
import { createTrelloClient } from '@/lib/trello/create-trello-client'
import { TrelloCard } from '@/lib/trello/types'
import { getConversation } from '@/lib/slack/get-conversation'

export async function handleCreateTrelloTaskFromSlack(
  job: CreateTrelloTaskFromSlack,
) {
  const { team_id, target_message_ts, channel_id, response_url } = job.data

  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
    await http.post(response_url, {
      text: `Error creating issue. Was homie App installed correctly to this workspace?`,
    })

    return
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  const trelloWorkspace = await dbClient
    .selectFrom('trello.workspace')
    .select(['trello_access_token', 'ext_trello_new_task_list_id'])
    .where('organization_id', '=', organization.id)
    .executeTakeFirst()

  if (!trelloWorkspace) {
    await http.post(response_url, {
      text: `Trello has not been installed to this organization. Please login to homie, and go to 'Settings > Trello' to install.`,
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

  const issueDescription = `**Slack Message:**\n\n[${initialMessage}](${slackMessageUrl})\n\n**Requirements:**\n\n${requirements}
`

  const trelloClient = createTrelloClient(trelloWorkspace.trello_access_token)

  const card = await trelloClient.post<TrelloCard>(`/cards`, {
    idList: trelloWorkspace.ext_trello_new_task_list_id,
    name: issue,
    desc: issueDescription,
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
                text: 'Trello task created:',
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
                url: card.shortUrl,
                text: card.name,
              },
              {
                type: 'text',
                text: '\n',
              },
              {
                type: 'text',
                text: card.desc,
              },
            ],
          },
        ],
      },
    ],
  })
}
