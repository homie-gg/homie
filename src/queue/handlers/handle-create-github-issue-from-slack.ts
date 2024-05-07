import { createSlackClient } from '@/lib/slack/create-slack-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { Conversation, TextMessageEvent } from '@/lib/slack/types'
import { CreateGithubIssueFromSlack } from '@/queue/jobs'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { GetAllTextMessages } from '@/lib/slack/get-all-text-messages'
import { summarizeTask } from '@/lib/ai/summarize-task'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/get-org-with-slack-team-id'
import { getOverPRLimitMessage } from '@/lib/billing/get-over-pr-limit-message'

export async function handleCreateGithubIssueFromSlack(
  job: CreateGithubIssueFromSlack,
) {
  const {
    team_id,
    target_message_ts,
    channel_id,
    response_url,
    gh_repo_full_name,
  } = job.data

  if (!gh_repo_full_name) {
    await http.post(response_url, {
      text: `Error creating issue. Missing GitHub repo.`,
    })

    return
  }

  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization || !organization.ext_gh_install_id) {
    await http.post(response_url, {
      text: `Error creating issue. Was homie App installed correctly to this workspace?`,
    })

    return
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  if (organization.is_over_plan_pr_limit && !organization.has_unlimited_usage) {
    await slackClient.post('chat.postMessage', {
      channel: channel_id,
      thread_ts: target_message_ts,
      text: getOverPRLimitMessage(),
    })

    return
  }

  const history = await slackClient.post<Conversation>(
    'conversations.history',
    {
      channel: channel_id, // same channel
      latest: target_message_ts, // start from target message
      inclusive: true, // include the target message
      limit: 30, // include the previous 30 messages for context
    },
  )

  if (history.messages.length === 0) {
    return
  }

  const initialMessage =
    'text' in history.messages[0] ? history.messages[0].text : 'Message'

  const slackMessageUrl = await getMessageLink({
    channelID: channel_id,
    messageTS: history.messages[0].ts,
    slackClient,
  })

  // Ignore previous bot messages
  const userMessages = history.messages.filter(
    (message) => !('bot_profile' in message),
  )

  const messages: TextMessageEvent[] = await GetAllTextMessages({
    channelID: channel_id,
    messages: userMessages,
    slackClient,
  })

  const data = await summarizeTask({ messages })
  if (!data) {
    await http.post(response_url, {
      text: `Error creating issue for: ${initialMessage}`,
    })
    return
  }

  const { task: issue, description } = data

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const issueDescription = `**Slack Message:**\n\n[${initialMessage}](${slackMessageUrl})\n\n${description}
`

  const gh_owner = gh_repo_full_name.split('/')[0] // repo is full name. e.g. 'octocat/hello-world'
  const gh_repo = gh_repo_full_name.split('/')[1]

  const githubIssue = await github.rest.issues.create({
    owner: gh_owner,
    repo: gh_repo,
    title: issue,
    body: issueDescription,
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
                text: 'Github issue created:',
                style: {
                  bold: true,
                },
              },
              {
                type: 'text',
                text: '\n',
              },
              {
                type: 'html_url' in githubIssue.data ? 'link' : 'text',
                url:
                  'html_url' in githubIssue.data
                    ? githubIssue.data.html_url
                    : undefined,
                text: `${githubIssue.data.title} (#${githubIssue.data.number})`,
              },
              {
                type: 'text',
                text: '\n',
              },
              {
                type: 'text',
                text: githubIssue.data.body,
              },
            ],
          },
        ],
      },
    ],
  })
}
