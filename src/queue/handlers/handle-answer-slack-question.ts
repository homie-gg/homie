import { createSlackClient } from '@/lib/api/slack/client'
import { AnswerSlackQuestion } from '@/queue/jobs'
import { findOrgWithSlackTeamId } from '@/lib/organization/get-org-with-slack-team-id'
import { answerQuestion } from '@/lib/ai/chat/answer-question'

export async function handleAnswerSlackQuestion(job: AnswerSlackQuestion) {
  const { channel_id, target_message_ts, text, team_id } = job.data
  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
    return
  }

  // Remove any unecessary info, eg. bot user ids
  const input = text
    .replace(`<@${organization.ext_slack_bot_user_id}>`, '')
    .trim()

  const slackClient = createSlackClient(organization.slack_access_token)

  const answer = await answerQuestion(input)

  // Reply
  await slackClient.post('chat.postMessage', {
    channel: channel_id,
    thread_ts: target_message_ts,
    text: answer,
  })
}
