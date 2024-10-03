import { findWriteCodeTargetFiles } from '@/lib/ai/find-write-code-target-files'
import { writeCodeForGithub } from '@/lib/github/write-code-for-github'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { sendPullRequestCreatedMessageToSlack } from '@/lib/slack/send-pull-request-created-message-to-slack'
import { createJob } from '@/queue/create-job'
import crypto from 'node:crypto'

interface WriteCodeBasePayload {
  organization: {
    id: number
    ext_gh_install_id: number | null
    slack_access_token: string
  }
  instructions: string
  slack_target_message_ts: string
  slack_channel_id: string
}

export const writeCode = createJob({
  id: 'write_code',
  handle: async (
    payload:
      | (WriteCodeBasePayload & {
          github_repo_id: number
          gitlab_project_id?: never
        })
      | (WriteCodeBasePayload & {
          gitlab_project_id: number
          github_repo_id?: never
        }),
    context,
  ) => {
    const {
      instructions,
      organization,
      slack_channel_id,
      slack_target_message_ts,
    } = payload

    const slackClient = createSlackClient(organization.slack_access_token)

    const files = await findWriteCodeTargetFiles({
      github_repo_id: payload.github_repo_id,
      gitlab_project_id: payload.gitlab_project_id,
      instructions,
      organization_id: organization.id,
    })

    // Generate unique code job id
    const id = crypto
      .createHash('sha1')
      .update(
        [
          new Date().valueOf(), // timestamp
          context.id ?? '', // job id
          organization.id,
          instructions,
        ].join(' '),
      )
      .digest('hex')
      .substring(0, 7) // get first 7 chars, same as git commits

    if (payload.github_repo_id && organization.ext_gh_install_id) {
      const pullRequest = await writeCodeForGithub({
        id,
        instructions,
        files,
        githubRepoId: payload.github_repo_id,
        organization: {
          id: organization.id,
          ext_gh_install_id: organization.ext_gh_install_id,
        },
      })

      await sendPullRequestCreatedMessageToSlack({
        threadTS: slack_target_message_ts,
        slackClient,
        channelID: slack_channel_id,
        title: pullRequest.title,
        url: pullRequest.html_url,
      })
    }

    // TODO write code fro gitlab
  },
})
