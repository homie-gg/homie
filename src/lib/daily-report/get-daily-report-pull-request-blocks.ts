import { dbClient } from '@/database/client'
import { storage } from '@/lib/storage'
import {
  ChatPostMessageArguments,
  RichTextBlock,
} from '@slack/web-api/dist/methods'

interface GetDailyReportPullRequestBlocks {
  repositoryContributionChartFile: string
  contributors: Record<
    number,
    {
      username: string
      ext_slack_member_id: string | null
      id: number
    }
  >
  repos: Array<
    | {
        name: string
        github_repo_id: number
        url: string
      }
    | {
        name: string
        gitlab_project_id: number
        url: string
      }
  >
}

export async function getDailyReportPullRequestBlocks(
  params: GetDailyReportPullRequestBlocks,
) {
  const { repositoryContributionChartFile, contributors, repos } = params
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
      image_url: storage.getUrl(repositoryContributionChartFile),
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
}
