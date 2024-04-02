import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import { chunkDiff } from '@/lib/ai/summarize-diff'
import {
  chatGPTCharLimit,
  shortenQuestionContext,
} from '@/lib/ai/shorten-question-context'
import { dbClient } from '@/lib/db/client'
import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai'
import {
  RecordMetadata,
  ScoredPineconeRecord,
} from '@pinecone-database/pinecone'

export async function answerGeneralQuestion(question: string): Promise<string> {
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  // 1. Turn question into a vector

  const embeddings = await embedder.embedQuery(question)

  // 2. Find 'answers' which are really just similar vectors

  const { matches } = await getEmbeddingMatches({
    embeddings,
    numTopResults: 1,
  })

  const match = matches[0]!

  const context = await getContext(question, match)


  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    question,
    context,
  })

  return model.invoke(input)
}

async function getContext(
  question: string,
  match: ScoredPineconeRecord<RecordMetadata>,
) {
  // Turn metadata from a JSON object to a text with headings
  let metadata = ''
  for (const [key, value] of Object.entries(match.metadata ?? {})) {
    metadata += `${key}:\n${value}\n`
  }

  const context = await shortenQuestionContext({
    question,
    context: metadata,
    promptLength: prompt.length,
  })

  // Append a diff (if one exists) for more context

  /**
   * How many chars left for diff
   */
  const diffLimit =
    chatGPTCharLimit - (question.length + context.length + prompt.length)
  const matchDiff = await getDiff(match)
  const diff = matchDiff ? chunkDiff(matchDiff, diffLimit)[0] : null

  if (!diff) {
    return context
  }

  return metadata + `\ndiff:\n${diff}`
}

async function getDiff(
  match: ScoredPineconeRecord<RecordMetadata>,
): Promise<string | null> {
  const githubId = match.metadata?.ext_gh_pull_request_id as number | undefined
  if (!githubId) {
    return null
  }

  const pullRequest = await dbClient
    .selectFrom('github.pull_request')
    .where('github.pull_request.ext_gh_pull_request_id', '=', githubId)
    .select('diff')
    .executeTakeFirst()
  if (!pullRequest) {
    return null
  }

  return pullRequest.diff
}

const prompt = `Answer the question based on the context below. You should follow ALL the following rules when generating and answer:
- There will be a CONTEXT, and a QUESTION.
- The CONTEXT is a JSON object that contains data you should use to answer the QUESTION.
- Your goal is to provide the user with an answer that is relevant to the question.
- Provide the user with a code example that is relevant to the question, if the context contains relevant code examples. Do not make up any code examples on your own.
- Do not make up any answers if the CONTEXT does not have relevant information.
- Do not mention the CONTEXT in the answer, but use them to generate the answer.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the answer to make it easier to read, but don't omit any information.
- Answer in a concise manner, and limit prose.
- If the answer mentions a Pull Request, include the Pull Request title, and url.

QUESTION:
{question}

CONTEXT:
{context}

Final Answer:`
