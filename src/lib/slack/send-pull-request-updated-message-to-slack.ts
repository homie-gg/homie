import { SlackClient } from '@/lib/slack/create-slack-client'

interface SendPullRequestUpdatedMessageToSlackParams {
  threadTS: string
  slackClient: SlackClient
  channelID: string
  title: string
  url: string
}

export async function sendPullRequestUpdatedMessageToSlack(
  params: SendPullRequestUpdatedMessageToSlackParams
) {
  const { threadTS, slackClient, channelID, title, url } = params

  await slackClient.chat.postMessage({
    channel: channelID,
    thread_ts: threadTS,
    text: `I've updated the Pull Request: <${url}|${title}>`,
  })
}
