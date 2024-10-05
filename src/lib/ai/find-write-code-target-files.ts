import { PullRequestDiffMetadata } from '@/lib/ai/embed-pull-request-diff'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { OpenAIEmbeddings } from '@langchain/openai'
import { CohereClient } from 'cohere-ai'
import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod.mjs'
import { z } from 'zod'

const findCodeFilesResponse = z.object({
  files: z
    .array(z.string())
    .describe('List of file names included in the diffs.'),
})

interface FindWriteCodeTargetFilesParams {
  instructions: string
  github_repo_id?: number
  gitlab_project_id?: number
  organization_id: number
}

type FindWriteCodeTargetFilesResult = string[]

/**
 * Cohere relevance score. If a task relevance score is above this, then it is
 * considered to potentially be a duplicate.
 */
const fileMatchesSummaryRelevanceScoreThreshold = 0.5

export async function findWriteCodeTargetFiles(
  params: FindWriteCodeTargetFilesParams,
): Promise<FindWriteCodeTargetFilesResult> {
  const { instructions, organization_id, github_repo_id, gitlab_project_id } =
    params

  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  const embeddings = await embedder.embedQuery(instructions)

  const vectorDB = getOrganizationVectorDB(organization_id)

  const filter: Record<string, any> = {
    organization_id: {
      $eq: organization_id,
    },
    type: {
      $eq: 'pull_request_diff',
    },
  }

  if (github_repo_id) {
    filter['github_repo_id'] = {
      $eq: github_repo_id,
    }
  }

  if (gitlab_project_id) {
    filter['gitlab_project_id'] = {
      $eq: gitlab_project_id,
    }
  }

  const { matches } = await vectorDB.query({
    vector: embeddings,
    topK: 100, // fetch lots of results, but we'll re-rank and take top x
    includeMetadata: true,
    filter,
  })

  if (matches.length === 0) {
    return []
  }

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: instructions,
    documents: matches.map(
      (match) => (match.metadata?.pull_request_summary ?? '') as string,
    ),
  })

  const rankedDocuments = reranked.results
    .filter(
      (result) =>
        result.relevanceScore > fileMatchesSummaryRelevanceScoreThreshold,
    )
    .map(
      (result) =>
        matches[result.index].metadata as unknown as PullRequestDiffMetadata,
    )

  if (rankedDocuments.length === 0) {
    return []
  }

  const diffs = rankedDocuments
    .slice(0, 15) // top files
    .map((doc) => doc.code_snippet)
    .join('\n')

  const prompt = `Given the following PR diffs, extract out all the file names with code changes:
${diffs}`

  const openAI = new OpenAI()
  const result = await openAI.beta.chat.completions.parse({
    model: 'gpt-4o-2024-08-06',
    messages: [
      {
        role: 'system',
        content: 'You are a software engineer.',
      },
      {
        role: 'user',
        content: prompt,
      },
    ],
    response_format: zodResponseFormat(
      findCodeFilesResponse,
      'findCodeFilesResponse',
    ),
  })

  const output = result.choices[0].message
  if (!output?.parsed || output.refusal) {
    return []
  }

  return output.parsed.files
}
