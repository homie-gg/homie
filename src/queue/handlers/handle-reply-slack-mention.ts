import { createSlackClient } from '@/lib/slack/create-slack-client'
import { ReplySlackMention } from '@/queue/jobs'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { getTextReplies } from '@/lib/slack/get-text-replies'
import { formatAnswer } from '@/lib/slack/format-answer'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'

export async function handleReplySlackMention(job: ReplySlackMention) {
  const { channel_id, target_message_ts, text, team_id, thread_ts } = job.data
  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
    return
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  if (await getIsOverPlanContributorLimit({ organization })) {
    await slackClient.post('chat.postMessage', {
      channel: channel_id,
      thread_ts: target_message_ts,
      text: getOverContributorLimitMessage(),
    })

    return
  }

  // Remove any unecessary info, eg. bot user ids
  const input = text
    .replace(`<@${organization.ext_slack_bot_user_id}>`, '')
    .trim()

  // If message is initial mention we'll handle it
  if (!thread_ts) {
    const answer = await getAnswer({
      messages: [
        {
          text: input,
          type: 'human',
          ts: target_message_ts,
        },
      ],
      organization,
      channelID: channel_id,
    })

    // Reply
    await slackClient.post('chat.postMessage', {
      channel: channel_id,
      thread_ts: target_message_ts,
      blocks: await formatAnswer(answer),
    })

    return
  }

  const threadMessages = await getTextReplies({
    channelID: channel_id,
    messageTS: thread_ts,
    slackClient,
  })

  const answer = await getAnswer({
    messages: threadMessages
      .filter((t) => t.user)
      .map((t) => {
        return {
          text: t.text,
          type: t.user === organization.ext_slack_bot_user_id ? 'bot' : 'human',
          ts: t.ts,
        }
      }),
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
