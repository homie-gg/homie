import { createSlackClient } from '@/lib/slack/create-slack-client'
import { ReplySlackThread } from '@/queue/jobs'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { getTextReplies } from '@/lib/slack/get-text-replies'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { formatAnswer } from '@/lib/slack/format-answer'

export async function handleReplySlackThread(job: ReplySlackThread) {
  const {
    channel_id,
    thread_ts,
    team_id,
    target_message_ts,
    ext_slack_user_id,
  } = job.data
  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
    return
  }

  // Do not reply to bot messages or we'll be in a loop
  if (ext_slack_user_id === organization.ext_slack_bot_user_id) {
    return
  }

  const slackClient = createSlackClient(organization.slack_access_token)
  const threadMessages = await getTextReplies({
    channelID: channel_id,
    messageTS: thread_ts,
    slackClient,
  })

  const mentions = threadMessages.filter((message) =>
    message.text.includes(`<@${organization.ext_slack_bot_user_id}>`),
  )

  const isBotThread = mentions.length > 0
  if (!isBotThread) {
    return
  }

  const answer = await getAnswer({
    messages: threadMessages.map((t) => ({
      text: t.text,
      type: t.user === organization.ext_slack_bot_user_id ? 'bot' : 'human',
      ts: t.ts,
    })),
    organization,
    channelID: channel_id,
  })

  // Reply
  await slackClient.post('chat.postMessage', {
    channel: channel_id,
    thread_ts: target_message_ts,
    blocks: await formatAnswer(answer),
  })
}
