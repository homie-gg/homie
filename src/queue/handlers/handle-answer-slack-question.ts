import { createSlackClient } from '@/lib/slack/create-slack-client'
import { AnswerSlackQuestion } from '@/queue/jobs'
import { findOrgWithSlackTeamId } from '@/lib/organization/get-org-with-slack-team-id'
import { answerQuestion } from '@/lib/ai/chat/answer-question'
import { getOverPRLimitMessage } from '@/lib/billing/get-over-pr-limit-message'

export async function handleAnswerSlackQuestion(job: AnswerSlackQuestion) {
  const { channel_id, target_message_ts, text, team_id } = job.data
  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
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

  // Remove any unecessary info, eg. bot user ids
  const input = text
    .replace(`<@${organization.ext_slack_bot_user_id}>`, '')
    .trim()

  const answer = await answerQuestion({
    question: input,
    organizationId: organization.id,
  })

  // Reply
  await slackClient.post('chat.postMessage', {
    channel: channel_id,
    thread_ts: target_message_ts,
    text: answer,
  })
}
