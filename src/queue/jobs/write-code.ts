import { findWriteCodeTargetFiles } from '@/lib/ai/find-write-code-target-files'
import { getWriteCodeContext } from '@/lib/ai/get-write-code-context'
import { writeCodeForGithub } from '@/lib/github/write-code-for-github'
import { writeCodeForGitlab } from '@/lib/github/write-code-for-gitlab'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { sendFailedToOpenPRMessage } from '@/lib/slack/send-failed-to-open-pr-message'
import { sendPullRequestCreatedMessageToSlack } from '@/lib/slack/send-pull-request-created-message-to-slack'
import { createJob } from '@/queue/create-job'
import crypto from 'node:crypto'

interface WriteCodeBasePayload {
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token: string | null
    slack_access_token?: string
  }
  instructions: string
  slack_target_message_ts?: string
  slack_channel_id?: string
  answer_id: string
  issue_number?: number
  issue_title?: string
  issue_body?: string
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
    job,
  ) => {
    const {
      instructions,
      organization,
      slack_channel_id,
      slack_target_message_ts,
      answer_id,
      issue_number,
      issue_title,
      issue_body,
    } = payload

    const slackClient = organization.slack_access_token
      ? createSlackClient(organization.slack_access_token)
      : null

    const files = await findWriteCodeTargetFiles({
      github_repo_id: payload.github_repo_id,
      gitlab_project_id: payload.gitlab_project_id,
      instructions,
      organization_id: organization.id,
    })

    const context = await getWriteCodeContext({
      github_repo_id: payload.github_repo_id,
      gitlab_project_id: payload.gitlab_project_id,
      instructions,
      organization_id: organization.id,
      issue_title,
      issue_body,
    })

    // Generate unique code job id
    const id = crypto
      .createHash('sha1')
      .update(
        [
          new Date().valueOf(), // timestamp
          job.id ?? '',
          organization.id,
          instructions,
        ].join(' '),
      )
      .digest('hex')
      .substring(0, 7) // get first 7 chars, same as git commits

    // GitHub
    if (payload.github_repo_id && organization.ext_gh_install_id) {
      const result = await writeCodeForGithub({
        id,
        instructions,
        context,
        files,
        githubRepoID: payload.github_repo_id,
        organization: {
          id: organization.id,
          ext_gh_install_id: organization.ext_gh_install_id,
        },
        answerID: answer_id,
        issueNumber: issue_number,
      })

      if (result.failed) {
        if (slackClient && slack_channel_id && slack_target_message_ts) {
          await sendFailedToOpenPRMessage({
            slackClient,
            channelID: slack_channel_id,
            threadTS: slack_target_message_ts,
          })
        }
        return
      }

      if (slackClient && slack_channel_id && slack_target_message_ts) {
        await sendPullRequestCreatedMessageToSlack({
          threadTS: slack_target_message_ts,
          slackClient,
          channelID: slack_channel_id,
          title: result.title,
          url: result.html_url,
        })
      }

      if (issue_number) {
        const github = await createGithubClient({
          installationId: organization.ext_gh_install_id,
        })
        const repo = await dbClient
          .selectFrom('github.repo')
          .where('id', '=', payload.github_repo_id)
          .select(['owner', 'name'])
          .executeTakeFirstOrThrow()

        await github.rest.issues.createComment({
          owner: repo.owner!,
          repo: repo.name,
          issue_number: issue_number,
          body: `I've opened a pull request to address this issue: [${result.title}](${result.html_url})`,
        })
      }

      return
    }

    // Gitlab
    if (payload.gitlab_project_id && organization.gitlab_access_token) {
      const result = await writeCodeForGitlab({
        id,
        instructions,
        context,
        files,
        gitlabProjectId: payload.gitlab_project_id,
        organization: {
          id: organization.id,
          gitlab_access_token: organization.gitlab_access_token,
        },
        answerID: answer_id,
      })

      if (result.failed) {
        if (slackClient && slack_channel_id && slack_target_message_ts) {
          await sendFailedToOpenPRMessage({
            slackClient,
            channelID: slack_channel_id,
            threadTS: slack_target_message_ts,
          })
        }
        return
      }

      if (slackClient && slack_channel_id && slack_target_message_ts) {
        await sendPullRequestCreatedMessageToSlack({
          threadTS: slack_target_message_ts,
          slackClient,
          channelID: slack_channel_id,
          title: result.title,
          url: result.html_url,
        })
      }

      return
    }

    // Failed...
    if (slackClient && slack_channel_id && slack_target_message_ts) {
      await sendFailedToOpenPRMessage({
        slackClient,
        channelID: slack_channel_id,
        threadTS: slack_target_message_ts,
      })
    }
  },
})
