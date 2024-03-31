import { getEmbeddingMatches } from '@/lib/ai/get-embedding-matches'
import {
  chatGPTCharLimit,
  summarizeQuestionContext,
} from '@/lib/ai/summarize-question-context'
import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI, OpenAIEmbeddings } from '@langchain/openai'

export async function askQuestion(question: string): Promise<string> {
  const embedder = new OpenAIEmbeddings({
    modelName: 'text-embedding-3-large',
  })

  // 1. Turn question into a vector

  const embeddings = await embedder.embedQuery(question)

  // 2. Find 'answers' which are really just similar vectors

  const { matches } = await getEmbeddingMatches({
    embeddings,
    numTopResults: 10,
  })

  // 3. Parse each answer text out of the metadata that was stored at embed time.

  const documents = matches
    .map((match) => String(match.metadata?.text))
    .join('\n')

  // 4. Summarize to make sure our context is < 4000 chars (ChatGPT limit)

  const context =
    documents.length > chatGPTCharLimit
      ? await summarizeQuestionContext({
          question,
          context: documents,
        })
      : documents

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-4' })

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question', 'context'],
  })

  const input = await promptTemplate.format({
    context,
    question,
  })

  return model.invoke(input)
}

const prompt = `Answer the question based on the context below. You should follow ALL the following rules when generating and answer:
- There will be a CONTEXT, and a QUESTION.
- Your goal is to provide the user with an answer that is relevant to the question.
- Provide the user with a code example that is relevant to the question, if the context contains relevant code examples. Do not make up any code examples on your own.
- Based on the CONTEXT, choose the source that is most relevant to the QUESTION.
- Do not make up any answers if the CONTEXT does not have relevant information.
- Do not mention the CONTEXT in the answer, but use them to generate the answer.
- ALWAYS prefer the result with the highest "score" value.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the CONTEXT to make it easier to read, but don't omit any information.
- It is IMPERATIVE that any link provided is found in the CONTEXT. Prefer not to provide a link if it is not found in the CONTEXT.

QUESTION: {question}

CONTEXT: {context}

Final Answer: `
