import { dbClient } from '@/database/client'
import { findWriteCodeTargetFiles } from '@/lib/ai/find-write-code-target-files'
import { getWriteCodeContext } from '@/lib/ai/get-write-code-context'
import { createGithubClient } from '@/lib/github/create-github-client'
import {
  writeCodeForGithub,
  WriteCodeResult,
} from '@/lib/github/write-code-for-github'
import { writeCodeForGitlab } from '@/lib/github/write-code-for-gitlab'
import { createSlackClient } from '@/lib/slack/create-slack-client'
import { sendFailedToOpenPRMessageToSlack } from '@/lib/slack/send-failed-to-open-pr-message-to-slack'
import { sendPullRequestCreatedMessageToSlack } from '@/lib/slack/send-pull-request-created-message-to-slack'
import { createJob } from '@/queue/create-job'
import crypto from 'node:crypto'

interface WriteCodeBasePayload {
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token?: string | null
    slack_access_token?: string
  }
  instructions: string
  slack_target_message_ts?: string
  slack_channel_id?: string
  answer_id: string
  github_issue_number?: number
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
      github_issue_number,
      github_repo_id,
      gitlab_project_id,
    } = payload

    const files = await findWriteCodeTargetFiles({
      github_repo_id,
      gitlab_project_id,
      instructions,
      organization_id: organization.id,
    })

    const context = await getWriteCodeContext({
      github_repo_id,
      gitlab_project_id,
      instructions,
      organization_id: organization.id,
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

    const result = await openPullRequest({
      id,
      organization,
      instructions,
      context,
      files,
      githubRepoID: github_repo_id,
      gitlabProjectID: gitlab_project_id,
      answerID: answer_id,
    })

    if (
      organization.slack_access_token &&
      slack_channel_id &&
      slack_target_message_ts
    ) {
      await sendSlackMessage({
        slackAccessToken: organization.slack_access_token,
        slackChannelID: slack_channel_id,
        slackTargetMessageTS: slack_target_message_ts,
        result,
      })
    }

    if (
      organization.ext_gh_install_id &&
      github_issue_number &&
      github_repo_id
    ) {
      await sendGithubIssueComment({
        githubIssueNumber: github_issue_number,
        githubRepoID: github_repo_id,
        organization: {
          id: organization.id,
          ext_gh_install_id: organization.ext_gh_install_id,
        },
        result,
      })
    }
  },
})

async function openPullRequest(params: {
  id: string
  organization: {
    id: number
    ext_gh_install_id: number | null
    gitlab_access_token?: string | null
    slack_access_token?: string
  }
  instructions: string
  context: string | null
  files: string[]
  gitlabProjectID?: number
  githubRepoID?: number
  answerID: string
}) {
  const {
    id,
    githubRepoID,
    answerID,
    gitlabProjectID,
    organization,
    instructions,
    context,
    files,
  } = params

  // GitHub
  if (githubRepoID && organization.ext_gh_install_id) {
    return writeCodeForGithub({
      id,
      instructions,
      context,
      files,
      githubRepoID,
      organization: {
        id: organization.id,
        ext_gh_install_id: organization.ext_gh_install_id,
      },
      answerID,
    })
  }

  // Gitlab
  if (gitlabProjectID && organization.gitlab_access_token) {
    return writeCodeForGitlab({
      id,
      instructions,
      context,
      files,
      gitlabProjectID,
      organization: {
        id: organization.id,
        gitlab_access_token: organization.gitlab_access_token,
      },
      answerID,
    })
  }

  throw new Error('Missing repo info')
}

async function sendSlackMessage(params: {
  slackAccessToken: string
  slackChannelID: string
  slackTargetMessageTS: string
  result: WriteCodeResult
}) {
  const { slackAccessToken, slackChannelID, slackTargetMessageTS, result } =
    params

  const slackClient = createSlackClient(slackAccessToken)

  if (result.failed) {
    await sendFailedToOpenPRMessageToSlack({
      slackClient,
      channelID: slackChannelID,
      threadTS: slackTargetMessageTS,
    })
    return
  }

  await sendPullRequestCreatedMessageToSlack({
    threadTS: slackTargetMessageTS,
    slackClient,
    channelID: slackChannelID,
    title: result.title,
    url: result.html_url,
  })
}

async function sendGithubIssueComment(params: {
  githubIssueNumber: number
  githubRepoID: number
  organization: {
    id: number
    ext_gh_install_id: number
  }
  result: WriteCodeResult
}) {
  const { githubIssueNumber, githubRepoID, organization, result } = params

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const githubRepo = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('id', '=', githubRepoID)
    .select(['owner', 'name'])
    .executeTakeFirst()

  if (!githubRepo?.name || !githubRepo.owner) {
    return
  }

  if (result.failed) {
    await github.rest.issues.createComment({
      issue_number: githubIssueNumber,
      owner: githubRepo.owner,
      repo: githubRepo.name,
      body: `Sorry, something went wrong and we couldn't create PR for this.`,
    })
    return
  }

  await github.rest.issues.createComment({
    issue_number: githubIssueNumber,
    owner: githubRepo.owner,
    repo: githubRepo.name,
    body: `Pull request for this: ${result.html_url}`,
  })
}
