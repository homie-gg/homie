import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'

interface SummarizeTaskParams {
  messages: Array<{ text: string }>
}

export async function summarizeTask(params: SummarizeTaskParams) {
  const { messages } = params
  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['context'],
  })

  const input = await promptTemplate.format({
    context: JSON.stringify(messages),
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })
  const output = await model.invoke(input)

  const regex = /.*Task.*\n(.*)\n*([\s\S]+)/
  const matches = regex.exec(output)
  if (!matches) {
    return null
  }

  if (matches.length < 3) {
    return null
  }

  const task = matches[1].replace('- ', '')
  const description = matches[2]

  return {
    task,
    description,
  }
}

const prompt = `Identify, and summarize a single Task that needs to be done from the context below. You should follow ALL of the following rules when generating an answer:
- There will be a CONTEXT.
- The context is a set of JSON objects, each object includes a "text" property that is chat message that was sent.
- The chat messages are in order with latest messages first.
- Stop looking for other tasks once you have identified one.
- Ignore any chat messages that are not relevant to the identified task.
- Each Task should describe the issue, and the requirement.
- Do not make up any information if the CONTEXT does not have relevant information.
- Use bullet points, lists, paragraphs and text styling to present the task summary in markdown.
- The answer should only be based on the CONTEXT. Do not use any external sources. Do not generate the response based on the question without clear reference to the context.
- Summarize the CONTEXT to make it easier to read, but don't omit any information.
- The summary should contain the following headings: Task, Requirements.
- Each point should be less than 10 words.

CONTEXT: {context}
`
