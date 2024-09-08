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
  repos: Array<{
    name: string
    url: string
    pullRequests: Array<{
      title: string
      contributor_id: number
      html_url: string
    }>
  }>
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
        elements: repo.pullRequests.map((pullRequest) => ({
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

  return pullRequestBlocks
}
