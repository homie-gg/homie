import { createSlackClient } from '@/lib/slack/create-slack-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { CreateGithubIssueFromSlack } from '@/queue/jobs'
import { getMessageLink } from '@/lib/slack/get-message-link'
import { summarizeTask } from '@/lib/ai/summarize-task'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { getConversation } from '@/lib/slack/get-conversation'

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
      text: `Error creating issue for: ${initialMessage}`,
    })
    return
  }

  const { task: issue, requirements } = data

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const issueDescription = `**Slack Message:**\n\n[${initialMessage}](${slackMessageUrl})\n\n**Requirements:**\n\n${requirements}
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
