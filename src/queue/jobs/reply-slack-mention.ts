import { createJob } from '@/queue/create-job'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { getAnswer } from '@/lib/ai/chat/get-answer'
import { formatAnswer } from '@/lib/slack/format-answer'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'
import { getSlackThreadMessages } from '@/lib/slack/get-slack-thread-messages'

export const replySlackMention = createJob({
  id: 'reply_slack_mention',
  handle: async (payload: {
    team_id: string
    channel_id: string
    target_message_ts: string
    thread_ts?: string
    text: string
  }) => {
    const { channel_id, target_message_ts, text, team_id, thread_ts } = payload
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

    const threadMessages = await getSlackThreadMessages({
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
            type:
              t.user === organization.ext_slack_bot_user_id ? 'bot' : 'human',
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
  },
})
