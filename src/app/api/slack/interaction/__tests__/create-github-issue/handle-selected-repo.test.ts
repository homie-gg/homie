import { mockCreateGithubClient } from '@/__utils__/mock-create-github-client'
import { mockCreateOpenAIClient } from '@/__utils__/mock-create-open-ai-client'
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
          id: 'selected_repo_team_id',
        },
        type: 'view_submission',
        view: {
          callback_id: 'gh_issue_create:selected_repo',
          private_metadata: JSON.stringify({
            team_id: 'selected_repo_team_id',
            channel_id: 'my_channel',
            target_message_ts: Date.now(),
            response_url: 'http://some_reply_url.slack.com',
          }),
          state: {
            values: {
              select_repo_block: {
                github_repo: {
                  selected_option: {
                    value: 'my_org/my_repo',
                  },
                },
              },
            },
          },
        },
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
      ext_clerk_user_id: 'create_gh_issue_user_id',
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('github.organization')
    .values({
      ext_gh_install_id: 12345,
      organization_id: organization.id,
    })
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('slack.workspace')
    .values({
      ext_slack_webhook_channel_id: 'my_channel_id',
      ext_slack_team_id: 'selected_repo_team_id',
      ext_slack_bot_user_id: 'bot_user_id',
      webhook_url: 'fake_webhook.slack.com',
      organization_id: organization.id,
      slack_access_token: 'some_slack_access_token',
    })
    .executeTakeFirstOrThrow()

  const slackRequest = jest.fn()

  mockCreateSlackClient.mockImplementationOnce(() => ({
    get: slackRequest,
    post: slackRequest,
  }))

  slackRequest.mockResolvedValueOnce({
    messages: [
      {
        text: 'some slack message',
        reply_count: 1,
      },
    ],
  })

  slackRequest.mockResolvedValueOnce({
    permalink: 'https://some_message_url.slack.com',
  })
  slackRequest.mockResolvedValueOnce({
    messages: [
      {
        text: 'some slack message',
      },
      {
        text: 'some reply',
      },
    ],
  })

  const openAIInvoke = jest.fn()

  mockCreateOpenAIClient.mockImplementationOnce(() => ({
    invoke: openAIInvoke,
  }))

  openAIInvoke.mockResolvedValueOnce(
    'Task\nfix latest deployment\nmake sure it works',
  )

  const mockCreateGithubIssue = jest.fn()

  mockCreateGithubClient.mockImplementationOnce(() => ({
    rest: {
      issues: {
        create: mockCreateGithubIssue,
      },
    },
  }))

  mockCreateGithubIssue.mockResolvedValueOnce({
    data: {
      html_url: 'https://github_issue_link.github.com',
      title: 'My created issue',
      number: 88,
      body: 'created issue',
    },
  })

  slackRequest.mockResolvedValueOnce('ok')

  await POST(req as any)

  expect(openAIInvoke).toHaveBeenCalledTimes(1)

  const [prompt] = openAIInvoke.mock.calls[0]
  expect(prompt).toContain('some slack message')
  expect(prompt).toContain('some reply')

  expect(mockCreateGithubIssue).toHaveBeenCalledTimes(1)

  const issueParams = mockCreateGithubIssue.mock.calls[0][0]

  expect(issueParams.owner).toBe('my_org')
  expect(issueParams.repo).toBe('my_repo')
  expect(issueParams.title).toBe('fix latest deployment')
  expect(issueParams.body).toContain('some slack message')
  expect(issueParams.body).toContain('https://some_message_url.slack.com')

  expect(slackRequest).toHaveBeenCalledTimes(4)

  const [endpoint, data] =
    slackRequest.mock.calls[slackRequest.mock.calls.length - 1]
  expect(endpoint).toBe('chat.postMessage')

  expect(data.channel).toBe('my_channel')
  expect(JSON.stringify(data.blocks)).toContain('Github issue created')
  expect(JSON.stringify(data.blocks)).toContain(
    'https://github_issue_link.github.com',
  )
  expect(JSON.stringify(data.blocks)).toContain('My created issue (#88)')
})
