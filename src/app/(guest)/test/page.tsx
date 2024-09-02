import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'

interface TestPageProps {}

export default async function TestPage(props: TestPageProps) {
  const {} = props

  const organization = await dbClient
    .selectFrom('homie.organization')
    .innerJoin(
      'slack.workspace',
      'slack.workspace.organization_id',
      'homie.organization.id',
    )
    .select([
      'slack_access_token',
      'ext_slack_webhook_channel_id',
      'organization.id',
    ])
    .executeTakeFirstOrThrow()

  const slackClient = createSlackClient(organization.slack_access_token)

  // Initial message
  const res = await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Daily Report 🎉',
          emoji: true,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: 'Pull Requests\n',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: '3 merged by 2 contributors\n\n',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: 'Tasks\n',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: '0 added\n',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: '2 completed\n',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: '5 assigned\n',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: '34 pending\n',
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .where('organization_id', '=', organization.id)
    .select(['ext_slack_member_id', 'username'])
    .executeTakeFirstOrThrow()

  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Pull Requests 🚢',
          emoji: true,
        },
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: contributor.ext_slack_member_id
            ? `<@${contributor.ext_slack_member_id}>`
            : contributor.username,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Repo',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 1,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'PR #1',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'PR #2',
                  },
                ],
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: '\n',
        },
      },
      {
        type: 'divider',
      },
    ],
  })

  // Tasks
  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: 'Tasks 🎯',
          emoji: true,
        },
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\nAdded',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #1',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #2',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #3',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n',
              },
            ],
          },
        ],
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: 'Completed',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #4',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #5',
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: 'Task #6',
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n',
              },
            ],
          },
        ],
      },
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: 'Assigned',
                style: {
                  bold: true,
                },
              },
            ],
          },
          {
            type: 'rich_text_list',
            style: 'bullet',
            indent: 0,
            border: 0,
            elements: [
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `Task #7 to ${
                      contributor.ext_slack_member_id
                        ? `<@${contributor.ext_slack_member_id}>`
                        : contributor.username
                    }`,
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `Task #8 to ${
                      contributor.ext_slack_member_id
                        ? `<@${contributor.ext_slack_member_id}>`
                        : contributor.username
                    }`,
                  },
                ],
              },
            ],
          },
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'text',
                text: '\n',
              },
            ],
          },
        ],
      },
      {
        type: 'section',
        text: {
          type: 'plain_text',
          text: '\n',
        },
      },
      {
        type: 'divider',
      },
    ],
  })

  return <div>{new Date().getSeconds()}</div>
}
