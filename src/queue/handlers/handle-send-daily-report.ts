import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { storage } from '@/lib/storage'
import { v4 as uuid } from 'uuid'

const mermaidCLIModule = import('@mermaid-js/mermaid-cli')

export async function handleSendDailyReport() {
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
      'homie.organization.id',
    ])
    .executeTakeFirstOrThrow()

  const diagram = `pie
    "repo/1" : 1
    "repo/2" : 2
    "repo/3" : 2`

  const id = uuid()
  const inputFile = `daily_report_diagram_${id}.mmd`
  const outputFile = `daily_report_diagram_${id}.png`

  await storage.put(inputFile, diagram)

  await (
    await mermaidCLIModule
  ).run(
    storage.getPath(inputFile),
    // @ts-ignore - ignoring a type for .png pattern in outputPath
    storage.getPath(outputFile),
    {
      outputFormat: 'png',
      parseMMDOptions: {
        viewport: {
          width: 2048,
          height: 2048,
        },
      },
      puppeteerConfig: {
        headless: 'new',
        executablePath: process.env.CHROME_BIN
          ? process.env.CHROME_BIN
          : undefined,
        args: ['--no-sandbox'], // I couldn't figure out how to run this in a container without this
      },
    },
  )
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
        type: 'image',
        title: {
          type: 'plain_text',
          text: 'Repo overview',
          emoji: true,
        },
        image_url: storage.getUrl(outputFile),
        alt_text: 'delicious tacos',
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

  await storage.delete(inputFile)
}
