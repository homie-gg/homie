import { RichTextList } from '@slack/bolt'
import {
  ChatPostMessageArguments,
  RichTextBlock,
} from '@slack/web-api/dist/methods'

interface GetDailyReportTaskBlocks {
  addedTasks: Array<{ name: string; html_url: string }>
  completedTasks: Array<{ name: string; html_url: string }>
  taskAssignments: Array<{ name: string; html_url: string }>
  assignedTasks: Record<
    number,
    {
      name: string
      html_url: string
      contributors: {
        username: string
        ext_slack_member_id: string | null
        id: number
      }[]
    }
  >
}

export async function getDailyReportTaskBlocks(
  params: GetDailyReportTaskBlocks,
) {
  const { completedTasks, addedTasks, taskAssignments, assignedTasks } = params

  const taskBlocks: ChatPostMessageArguments['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Tasks 🎯',
        emoji: true,
      },
    },
  ]

  const taskElements: RichTextBlock['elements'] = []

  if (addedTasks.length > 0) {
    taskElements.push({
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
    })

    const addedElements: RichTextList['elements'] = []

    for (const addedTask of addedTasks) {
      addedElements.push({
        type: 'rich_text_section',
        elements: [
          {
            type: 'link',
            text: addedTask.name,
            url: addedTask.html_url,
          },
        ],
      })
    }

    taskElements.push({
      type: 'rich_text_list',
      style: 'bullet',
      indent: 0,
      border: 0,
      elements: addedElements,
    })
  }

  if (completedTasks.length > 0) {
    taskElements.push({
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
    })

    const completedElements: RichTextList['elements'] = []

    for (const completedTask of completedTasks) {
      completedElements.push({
        type: 'rich_text_section',
        elements: [
          {
            type: 'link',
            text: completedTask.name,
            url: completedTask.html_url,
          },
        ],
      })
    }

    taskElements.push({
      type: 'rich_text_list',
      style: 'bullet',
      indent: 0,
      border: 0,
      elements: completedElements,
    })
  }

  if (taskAssignments.length > 0) {
    taskElements.push({
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
    })

    const assignedElements: RichTextList['elements'] = []

    for (const assignedTask of Object.values(assignedTasks)) {
      assignedElements.push({
        type: 'rich_text_section',
        elements: [
          {
            type: 'link',
            text: `${assignedTask.name} to ${assignedTask.contributors
              .map((contributor) =>
                contributor.ext_slack_member_id
                  ? `<@${contributor.ext_slack_member_id}>`
                  : contributor.username,
              )
              .join(', ')}`,
            url: assignedTask.html_url,
          },
        ],
      })
    }

    taskElements.push({
      type: 'rich_text_list',
      style: 'bullet',
      indent: 0,
      border: 0,
      elements: assignedElements,
    })
  }

  taskBlocks.push({
    type: 'rich_text',
    elements: taskElements,
  })

  taskBlocks.push(
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
  )
}
