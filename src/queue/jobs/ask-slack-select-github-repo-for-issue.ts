import { createSlackClient } from '@/lib/slack/create-slack-client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { http } from '@/lib/http/client/http'
import { findOrgWithSlackTeamId } from '@/lib/organization/find-org-with-slack-team-id'
import { ModalView } from '@slack/bolt'
import { createJob } from '@/queue/create-job'

export type CreateGithubIssueSelectedRepoMetadata = {
  team_id: string
  channel_id: string
  target_message_ts: string
  response_url: string
}

export const askSlackSelectAsanaProjectForTask = createJob({
  id: 'ask_slack_select_github_repo_for_issue',
  handle: async (payload: {
    team_id: string
    trigger_id: string
    channel_id: string
    target_message_ts: string
    response_url: string
  }) => {
    const { response_url, team_id, channel_id, target_message_ts, trigger_id } =
      payload
    const organization = await findOrgWithSlackTeamId(team_id)

    if (!organization || !organization.ext_gh_install_id) {
      await http.post(response_url, {
        text: `Error creating issue. Was homie App installed correctly to this workspace?`,
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
  },
})
