import { mockCreateGithubApp } from '@/__utils__/mock-create-github-app'
import { mockCreateGithubClient } from '@/__utils__/mock-create-github-client'
import { mockCreateOpenAIClient } from '@/__utils__/mock-create-open-ai-client'
import { mockCreateOpenAIEmbedder } from '@/__utils__/mock-create-open-ai-embedder'
import { mockGetPineconeClient } from '@/__utils__/mock-get-pinecone-client'
import { mockLoadSummarizationChain } from '@/__utils__/mock-load-summarization-chain'
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
    .insertInto('voidpm.organization')
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

  const openAIInvoke = jest.fn()

  mockCreateOpenAIClient.mockReturnValue({
    invoke: openAIInvoke,
  })

  openAIInvoke.mockResolvedValueOnce({
    text: 'this is the summarized diff',
  })

  mockLoadSummarizationChain.mockReturnValueOnce({
    invoke: openAIInvoke,
  })

  openAIInvoke.mockResolvedValueOnce('this is the pr summary')

  openAIInvoke.mockResolvedValueOnce(`
  - snippet one
  - snippet 2
  `)

  mockCreateOpenAIClient.mockReturnValueOnce({
    invoke: openAIInvoke,
  })

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
    .selectFrom('voidpm.contributor')
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

  expect(openAIInvoke).toHaveBeenCalledTimes(3)

  // Did call to summarize diff
  expect(
    openAIInvoke.mock.calls[0][0].input_documents[0].pageContent,
  ).toContain('+++ some pr diff')

  const pullRequest = await dbClient
    .selectFrom('voidpm.pull_request')
    .where('ext_gh_pull_request_id', '=', 8282)
    .selectAll()
    .executeTakeFirstOrThrow()
  expect(pullRequest.title).toBe('My test closed PR')

  // Assert summarize diff
  expect(openAIInvoke.mock.calls[1][0]).toContain('this is the summarized diff')

  // assert extract code snippets
  expect(openAIInvoke.mock.calls[2][0]).toContain(
    'Given the following SUMMARY, extract out relevant snippets of code from the DIFF',
  )
  expect(openAIInvoke.mock.calls[2][0]).toContain('+++ some pr diff')

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
})
