import { createSlackClient } from '@/lib/api/slack/create-slack-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { AskSlackSelectGithubRepoForIssue } from '@/queue/jobs'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/get-org-with-slack-team-id'
import { ModalView } from '@slack/bolt'

export type CreateGithubIssueSelectedRepoMetadata = {
  team_id: string
  channel_id: string
  target_message_ts: string
  response_url: string
}

export async function handleAskSlackSelectGithubRepoForIssue(
  job: AskSlackSelectGithubRepoForIssue,
) {
  const { response_url, team_id, channel_id, target_message_ts, trigger_id } =
    job.data
  const organization = await findOrgWithSlackTeamId(team_id)

  if (!organization) {
    await http.post(response_url, {
      text: `Error creating issue. Was Void App installed correctly to this workspace?`,
    })

    return
  }

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const repos = await github.request('GET /installation/repositories', {
    headers: {
      'X-GitHub-Api-Version': '2022-11-28',
    },
  })

  const metadata: CreateGithubIssueSelectedRepoMetadata = {
    team_id,
    channel_id,
    target_message_ts,
    response_url,
  }

  const modal: ModalView = {
    type: 'modal',
    title: {
      type: 'plain_text',
      text: 'Select a Github Repo',
    },
    callback_id: 'gh_issue_create:selected_repo',
    blocks: [
      {
        block_id: `select_repo_block`,
        type: 'input',
        label: {
          type: 'plain_text',
          text: 'Repository',
          emoji: true,
        },
        element: {
          action_id: 'github_repo',
          type: 'static_select',
          placeholder: {
            type: 'plain_text',
            text: 'Pick one',
            emoji: true,
          },
          options: repos.data.repositories.map((repo) => ({
            text: {
              type: 'plain_text',
              text: repo.name,
            },
            value: repo.full_name,
          })),
        },
      },
    ],
    private_metadata: JSON.stringify(metadata),
    submit: {
      type: 'plain_text',
      text: 'Create Issue',
    },
    close: {
      type: 'plain_text',
      text: 'Cancel',
    },
  }

  const slackClient = createSlackClient(organization.slack_access_token)

  await slackClient.post('views.open', {
    trigger_id,
    view: modal,
  })
}
