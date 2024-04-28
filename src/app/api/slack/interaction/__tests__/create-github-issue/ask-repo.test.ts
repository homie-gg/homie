import { mockCreateGithubClient } from '@/__utils__/mock-create-github-client'
import { mockCreateSlackClient } from '@/__utils__/mock-create-slack-client'
import { POST } from '@/app/api/slack/interaction/route'
import { dbClient } from '@/database/client'

jest.mock('lib/slack/verify-slack-request')

afterAll(async () => {
  await dbClient.destroy()
})

it('should ask to select repo', async () => {
  const formData = {
    get: () =>
      JSON.stringify({
        team: {
          id: 'create_gh_issue_team_id',
        },
        trigger_id: 'trigger_id',
        type: 'message_action',
        callback_id: 'gh_issue_create:start',
        channel: {
          id: 'my_channel',
        },
        message: {
          ts: Date.now(),
        },
        response_url: 'http://some_reply_url.slack.com',
      }),
  }

  const req = {
    headers: {
      get: jest.fn(),
    },
    clone: jest.fn(),
    text: jest.fn(),
    formData: async () => formData,
  }

  req.clone.mockImplementationOnce(() => req)

  req.headers.get.mockImplementationOnce(() => 'some_slack_signature')
  req.headers.get.mockImplementationOnce(() => Date.now() / 1000) // timestamp
  req.text.mockImplementationOnce(() => 'req_body')

  const organization = await dbClient
    .insertInto('voidpm.organization')
    .values({
      ext_clerk_user_id: 'ask_repo_user_id',
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('github.organization')
    .values({
      ext_gh_install_id: 1234,
      organization_id: organization.id,
    })
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('slack.workspace')
    .values({
      ext_slack_webhook_channel_id: 'my_channel_id',
      ext_slack_team_id: 'create_gh_issue_team_id',
      ext_slack_bot_user_id: 'bot_user_id',
      webhook_url: 'fake_webhook.slack.com',
      organization_id: organization.id,
      slack_access_token: 'some_slack_access_token',
    })
    .executeTakeFirstOrThrow()

  mockCreateGithubClient.mockImplementationOnce(() => ({
    request: async () => ({
      data: {
        repositories: [
          {
            name: 'repo_1',
            full_name: 'Repo One',
          },
        ],
      },
    }),
  }))

  const slackPost = jest.fn()
  mockCreateSlackClient.mockImplementationOnce(() => ({
    post: slackPost,
  }))

  await POST(req as any)

  expect(slackPost).toHaveBeenCalledTimes(1)

  const [endpoint, data] = slackPost.mock.calls[0]
  expect(endpoint).toBe('views.open')
  expect(data.view.type).toBe('modal')
  expect(data.view.callback_id).toBe('gh_issue_create:selected_repo')
  expect(data.view.blocks[0].element.options[0].text.text).toBe('repo_1')
})
