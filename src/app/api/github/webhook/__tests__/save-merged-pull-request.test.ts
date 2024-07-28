import { mockCreateGithubApp } from '@/__utils__/mock-create-github-app'
import { mockCreateGithubClient } from '@/__utils__/mock-create-github-client'
import { mockCreateOpenAIEmbedder } from '@/__utils__/mock-create-open-ai-embedder'
import { mockExtractCodeSnippets } from '@/__utils__/mock-extract-code-snippets'
import { mockGetPineconeClient } from '@/__utils__/mock-get-pinecone-client'
import { mockSummarizeCodeChange } from '@/__utils__/mock-summarize-code-change'
import { POST } from '@/app/api/github/webhook/route'
import { dbClient } from '@/database/client'

afterAll(async () => {
  dbClient.destroy()
})

it('should create and embed a pr', async () => {
  const req = {
    clone: () => req,
    json: async () => ({}),
    headers: {
      get: jest.fn(),
    },
    text: async () => '',
  }

  const onWebhook = jest.fn()

  mockCreateGithubApp.mockImplementationOnce(() => ({
    webhooks: {
      on: onWebhook,
      verifyAndReceive: () => {},
    },
  }))

  await POST(req as any)

  const pullRequestClosedHandler = onWebhook.mock.calls.find((calls) => {
    return calls[0] === 'pull_request.closed'
  })[1]

  const organization = await dbClient
    .insertInto('homie.organization')
    .values({
      ext_clerk_user_id: 'test_save_merged_pr_user_id',
    })
    .returningAll()
    .executeTakeFirstOrThrow()

  await dbClient
    .insertInto('github.organization')
    .values({
      ext_gh_install_id: 23891,
      organization_id: organization.id,
    })
    .executeTakeFirstOrThrow()

  mockCreateGithubClient.mockResolvedValue({
    rest: {
      pulls: {
        get: async () => ({
          data: '+++ some pr diff',
        }),
      },
      issues: {
        get: async () => ({
          data: {
            body: 'issue for closed pr',
          },
        }),
      },
    },
  })

  mockSummarizeCodeChange.mockResolvedValueOnce('test PR summary')

  mockExtractCodeSnippets.mockResolvedValueOnce([
    'some code snippet',
    'second code snippet',
  ])

  const mockEmbed = jest.fn()

  mockCreateOpenAIEmbedder.mockReturnValue({
    embedQuery: mockEmbed,
  })

  mockEmbed.mockResolvedValueOnce([1.232, 2.3434])

  const mockUpsert = jest.fn()
  mockGetPineconeClient.mockReturnValue({
    Index: () => ({
      upsert: mockUpsert,
    }),
  })

  await pullRequestClosedHandler({
    payload: {
      pull_request: {
        created_at: new Date().toISOString(),
        id: 8282,
        number: 10,
        title: 'My test closed PR',
        html_url: 'github.com/test_closed_pr',
        body: 'closes #889',
        head: {
          ref: 'test_closed_branch',
        },
        base: {
          ref: 'test_closed_branch',
          repo: {
            id: 129919,
            default_branch: 'test_closed_branch',
            name: 'test_closed_repo',
            html_url: 'github.com/test_closed_repo',
            full_name: 'test_closed_org/test_closed_repo',
          },
        },
        merged_at: new Date().toISOString(),
        user: {
          id: 92383,
          login: 'closed_pr_author',
        },
      },
      installation: {
        id: 23891,
      },
    },
  })

  const contributor = await dbClient
    .selectFrom('homie.contributor')
    .where('ext_gh_user_id', '=', 92383)
    .select(['username'])
    .executeTakeFirstOrThrow()

  expect(contributor?.username).toBe('closed_pr_author')

  const repo = await dbClient
    .selectFrom('github.repo')
    .where('ext_gh_repo_id', '=', 129919)
    .select(['name'])
    .executeTakeFirstOrThrow()

  expect(repo.name).toBe('test_closed_repo')

  expect(mockSummarizeCodeChange).toHaveBeenCalledTimes(1)
  const mockSummarizeCodeChangeData = mockSummarizeCodeChange.mock.calls[0][0]
  expect(mockSummarizeCodeChangeData.title).toBe('My test closed PR')
  expect(mockSummarizeCodeChangeData.diff).toBe('+++ some pr diff')
  expect(mockSummarizeCodeChangeData.issue).toBe('\nissue for closed pr')
  expect(mockSummarizeCodeChangeData.body).toBe('closes #889')

  const pullRequest = await dbClient
    .selectFrom('homie.pull_request')
    .where('ext_gh_pull_request_id', '=', 8282)
    .selectAll()
    .executeTakeFirstOrThrow()
  expect(pullRequest.title).toBe('My test closed PR')

  expect(mockUpsert.mock.calls[0][0][0]['metadata']['type']).toBe('pr_summary')
  expect(mockUpsert.mock.calls[0][0][0]['metadata']['text']).toContain(
    'My test closed PR',
  )
  expect(mockUpsert.mock.calls[0][0][0]['metadata']['text']).toContain(
    'github.com/test_closed_pr',
  )
  expect(mockUpsert.mock.calls[0][0][0]['metadata']['text']).toContain(
    'closed_pr_author',
  )

  expect(mockUpsert.mock.calls[1][0][0]['metadata']['type']).toBe('pr_diff')
  expect(mockUpsert.mock.calls[1][0][0]['metadata']['text']).toContain(
    'some code snippet',
  )
})
