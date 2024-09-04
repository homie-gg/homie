import { dbClient } from '@/database/client'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { storage } from '@/lib/storage'
import { taskStatus } from '@/lib/tasks'
import { v4 as uuid } from 'uuid'
import {
  ChatPostMessageArguments,
  RichTextBlock,
} from '@slack/web-api/dist/methods'
import { RichTextList } from '@slack/bolt'

const mermaidCLIModule = import('@mermaid-js/mermaid-cli')

// TODO
// - add homie tips at the end
// - update job to run on schedule and send per org
// - add settings to configure when daily reports should go out

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

  // const cutOffDate = getPullRequestCutoffDate({ organization })

  const githubRepos = await dbClient
    .selectFrom('github.repo')
    .select(['name', 'id as github_repo_id', 'html_url as url'])
    .where('github.repo.organization_id', '=', organization.id)
    .execute()

  const gitlabProjects = await dbClient
    .selectFrom('gitlab.project')
    .select(['name', 'id as gitlab_project_id', 'web_url as url'])
    .where('gitlab.project.organization_id', '=', organization.id)
    .execute()

  const repos = [...githubRepos, ...gitlabProjects]

  const reposWithPullRequests = await Promise.all(
    repos.map(async (repo) => {
      let pullRequestsQuery = dbClient
        .selectFrom('homie.pull_request')
        .where('merged_at', 'is not', null)
        // .where('merged_at', '>', cutOffDate)
        // Only send PRs merged to default branch
        .where((eb) =>
          eb('homie.pull_request.was_merged_to_default_branch', '=', true)
            // Assume no target_branch (legacy) to be default branch, which were the only PRs saved.
            .or('homie.pull_request.target_branch', 'is', null),
        )
        .select([
          'homie.pull_request.html_url',
          'homie.pull_request.title',
          'homie.pull_request.contributor_id',
        ])
        .orderBy('merged_at')

      if ('github_repo_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'github_repo_id',
          '=',
          repo.github_repo_id,
        )
      }

      if ('gitlab_project_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'gitlab_project_id',
          '=',
          repo.gitlab_project_id,
        )
      }

      const pullRequests = await pullRequestsQuery.execute()

      return {
        name: repo.name,
        pullRequests,
      }
    }),
  )

  let numPullRequests = 0
  let diagram = `pie`
  const contributors: Record<
    number,
    {
      id: number
      username: string
      ext_slack_member_id: string | null
    }
  > = {}

  for (const repo of reposWithPullRequests) {
    if (repo.pullRequests.length === 0) {
      continue
    }

    diagram += `\n  "${repo.name}" : ${repo.pullRequests.length}`
    numPullRequests += repo.pullRequests.length

    for (const pullRequest of repo.pullRequests) {
      const contributor = await dbClient
        .selectFrom('homie.contributor')
        .where('organization_id', '=', organization.id)
        .where('id', '=', pullRequest.contributor_id)
        .select(['username', 'ext_slack_member_id', 'id'])
        .executeTakeFirst()

      if (!contributor) {
        continue
      }

      contributors[pullRequest.contributor_id] = contributor
    }
  }

  const numContributors = Object.keys(contributors).length

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

  const addedTasks = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', organization.id)
    // .where('created_at', '>', cutOffDate)
    .where('task_status_id', '=', taskStatus.open)
    .select(['name', 'html_url'])
    .execute()

  const completedTasks = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', organization.id)
    // .where('completed_at', '>', cutOffDate)
    .select(['name', 'html_url'])
    .execute()

  const taskAssignments = await dbClient
    .selectFrom('homie.contributor_task')
    .innerJoin('homie.task', 'homie.contributor_task.task_id', 'homie.task.id')
    .where('homie.task.organization_id', '=', organization.id)
    .select([
      'name',
      'html_url',
      'homie.contributor_task.contributor_id as assigned_contributor_id',
      'homie.task.id as task_id',
    ])
    // .where('homie.contributor_task.created_at', '>', cutOffDate)
    .execute()

  const assignedTasks: Record<
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
  > = {}
  for (const taskAssignment of taskAssignments) {
    const contributor = contributors[taskAssignment.assigned_contributor_id]
    if (!contributor) {
      continue
    }

    assignedTasks[taskAssignment.task_id] = {
      name: taskAssignment.name,
      html_url: taskAssignment.html_url,
      contributors: [
        ...(assignedTasks[taskAssignment.task_id]?.contributors ?? []),
        contributor,
      ],
    }
  }

  const numAssignedTasks = Object.keys(assignedTasks).length

  const pendingTasks = await dbClient
    .selectFrom('homie.task')
    .where('task_status_id', '=', taskStatus.open)
    .where('homie.task.organization_id', '=', organization.id)
    .execute()

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
          text: 'Daily Report 📋',
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
                    text: `${numPullRequests} merged by ${numContributors} contributors\n\n`,
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
                    text: `${addedTasks.length} added\n`,
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `${completedTasks.length} completed\n`,
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `${numAssignedTasks} assigned\n`,
                  },
                ],
              },
              {
                type: 'rich_text_section',
                elements: [
                  {
                    type: 'text',
                    text: `${pendingTasks.length} pending\n`,
                  },
                ],
              },
            ],
          },
        ],
      },
    ],
  })

  const pullRequestBlocks: ChatPostMessageArguments['blocks'] = [
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
        text: 'Repos',
        emoji: true,
      },
      image_url: storage.getUrl(outputFile),
      alt_text: 'repos pie chart',
    },
  ]

  for (const contributor of Object.values(contributors)) {
    pullRequestBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contributor.ext_slack_member_id
          ? `<@${contributor.ext_slack_member_id}>`
          : contributor.username,
      },
    })

    for (const repo of repos) {
      let pullRequestsQuery = dbClient
        .selectFrom('homie.pull_request')
        .where('contributor_id', '=', contributor.id)
        .where('merged_at', 'is not', null)
        // .where('merged_at', '>', cutOffDate)
        // Only send PRs merged to default branch
        .where((eb) =>
          eb('homie.pull_request.was_merged_to_default_branch', '=', true)
            // Assume no target_branch (legacy) to be default branch, which were the only PRs saved.
            .or('homie.pull_request.target_branch', 'is', null),
        )
        .select(['homie.pull_request.html_url', 'homie.pull_request.title'])
        .orderBy('merged_at')

      if ('github_repo_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'github_repo_id',
          '=',
          repo.github_repo_id,
        )
      }

      if ('gitlab_project_id' in repo) {
        pullRequestsQuery = pullRequestsQuery.where(
          'gitlab_project_id',
          '=',
          repo.gitlab_project_id,
        )
      }

      const pullRequests = await pullRequestsQuery.execute()

      if (pullRequests.length === 0) {
        continue
      }

      const elements: RichTextBlock['elements'] = []

      // Repo header
      elements.push({
        type: 'rich_text_list',
        style: 'bullet',
        indent: 0,
        border: 0,
        elements: [
          {
            type: 'rich_text_section',
            elements: [
              {
                type: 'link',
                url: repo.url,
                text: repo.name,
                style: {
                  bold: true,
                },
              },
            ],
          },
        ],
      })

      // Pull requests
      elements.push({
        type: 'rich_text_list',
        style: 'bullet',
        indent: 1,
        border: 0,
        elements: pullRequests.map((pullRequest) => ({
          type: 'rich_text_section',
          elements: [
            {
              type: 'link',
              url: pullRequest.html_url,
              text: pullRequest.title,
            },
          ],
        })),
      })

      pullRequestBlocks.push({
        type: 'rich_text',
        elements,
      })
    }
  }

  pullRequestBlocks.push(
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

  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: pullRequestBlocks,
  })

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

    for (const taskAssignment of Object.values(assignedTasks)) {
      assignedElements.push({
        type: 'rich_text_section',
        elements: [
          {
            type: 'link',
            text: `${taskAssignment.name} to ${taskAssignment.contributors
              .map((contributor) =>
                contributor.ext_slack_member_id
                  ? `<@${contributor.ext_slack_member_id}>`
                  : contributor.username,
              )
              .join(', ')}`,
            url: taskAssignment.html_url,
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
  // Tasks
  await slackClient.post<{
    ts: string
  }>('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    thread_ts: res.ts,
    blocks: taskBlocks,
  })

  await storage.delete(inputFile)
}
