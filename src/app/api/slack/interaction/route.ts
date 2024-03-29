import { NextRequest, NextResponse } from 'next/server'
import { verifySlackRequest } from '@/lib/api/slack/verify-slack-request'
import { SlackShortcut, ViewSubmitAction } from '@slack/bolt'
import { defaultQueue } from '@/queue/default-queue'
import { CreateGithubIssueSelectedRepoMetadata } from '@/queue/handlers/handle-ask-slack-select-github-repo-for-issue'

export const POST = async (request: NextRequest) => {
  const isValidRequest = verifySlackRequest({
    signature: request.headers.get('x-slack-signature')!,
    body: await request.clone().text(),
    timestamp: Number(request.headers.get('x-slack-request-timestamp')),
  })

  if (!isValidRequest) {
    return NextResponse.json({ error: 'invalid_request' }, { status: 400 })
  }

  const formData = await request.formData()
  const payload = formData.get('payload')
  if (!payload || payload instanceof File) {
    return NextResponse.json({})
  }

  const shortcut: SlackShortcut | ViewSubmitAction = JSON.parse(payload)

  if (!shortcut.team) {
    return NextResponse.json({})
  }

  if (
    shortcut.type === 'view_submission' &&
    shortcut.view.callback_id === 'gh_issue_create:selected_repo'
  ) {
    const data: CreateGithubIssueSelectedRepoMetadata = JSON.parse(
      shortcut.view.private_metadata,
    )

    const gh_repo_full_name =
      shortcut.view.state.values['select_repo_block']['github_repo']
        .selected_option?.value ?? null

    await defaultQueue.add('create_github_issue_from_slack', {
      team_id: data.team_id,
      target_message_ts: data.target_message_ts,
      channel_id: data.channel_id,
      response_url: data.response_url,
      gh_repo_full_name,
    })
  }

  if (
    shortcut.type === 'message_action' &&
    shortcut.callback_id === 'gh_issue_create:start'
  ) {
    await defaultQueue.add('ask_slack_select_github_repo_for_issue', {
      team_id: shortcut.team.id,
      trigger_id: shortcut.trigger_id,
      channel_id: shortcut.channel.id,
      target_message_ts: shortcut.message.ts,
      response_url: shortcut.response_url,
    })
  }

  return NextResponse.json({})
}
