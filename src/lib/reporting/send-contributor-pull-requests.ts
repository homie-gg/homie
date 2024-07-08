import { SlackClient } from '@/lib/slack/create-slack-client'
import { dbClient } from '@/database/client'
import { getPullRequestCutoffDate } from '@/lib/reporting/get-pull-request-cut-off-date'
import {
  ChatPostMessageArguments,
  RichTextBlock,
} from '@slack/web-api/dist/methods'

interface SendContributorPullRequestsParams {
  contributor: {
    id: number
    username: string
    ext_slack_member_id: string | null
  }
  organization: {
    id: number
    ext_slack_webhook_channel_id: string
    send_pull_request_summaries_interval: string
    send_pull_request_summaries_day: string
    send_pull_request_summaries_time: string
  }
  slackClient: SlackClient
}

export async function sendContributorPullRequests(
  params: SendContributorPullRequestsParams,
) {
  const { contributor, organization, slackClient } = params

  const cutOffDate = getPullRequestCutoffDate({ organization })

  const blocks: ChatPostMessageArguments['blocks'] = [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: contributor.ext_slack_member_id
          ? `<@${contributor.ext_slack_member_id}>`
          : contributor.username,
      },
    },
  ]

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

  for (const repo of repos) {
    let pullRequestsQuery = dbClient
      .selectFrom('homie.pull_request')
      .where('contributor_id', '=', contributor.id)
      .where('merged_at', 'is not', null)
      .where('merged_at', '>', cutOffDate)
      // Only send PRs merged to default branch
      .where((eb) =>
        eb.or([
          eb('was_merged_to_default_branch', '=', true),
          // Assume no target_branch (legacy) to be default branch, which were the only PRs saved.
          eb('target_branch', 'is', null),
        ]),
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

    blocks.push({
      type: 'rich_text',
      elements,
    })
  }

  await slackClient.post('chat.postMessage', {
    channel: organization.ext_slack_webhook_channel_id,
    blocks,
  })
}
