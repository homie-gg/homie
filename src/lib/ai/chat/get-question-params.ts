import { howLongOnTask } from '@/lib/ai/chat/answers/02-how-long-on-task'
import { QuestionParams, questionParams } from '@/lib/ai/chat/types'
import { StructuredOutputParser } from 'langchain/output_parsers'
import { PromptTemplate } from '@langchain/core/prompts'
import { OpenAI } from '@langchain/openai'
import { questions } from '@/lib/ai/chat/questions'

export async function getQuestionParams(
  question: string,
): Promise<QuestionParams> {
  const parser = StructuredOutputParser.fromZodSchema(questionParams)

  const promptTemplate = new PromptTemplate({
    template: prompt,
    inputVariables: ['question'],
    partialVariables: { format_instructions: parser.getFormatInstructions() },
  })

  const input = await promptTemplate.format({
    question,
  })

  const model = new OpenAI({ temperature: 0, modelName: 'gpt-3.5-turbo' })

  const output = await model.invoke(input)

  return parser.parse(output)
}

const prompt = `Given the following QUESTION, select the best query from the list of QUERIES. You MUST follow the following rules when answering:
- If you do not recognize the question return the text "UNKNOWN"
- Your response must be in JSON.
- ALWAYS return the selected QUERY in the response JSON under the property "question"
- You MUST match the FORMAT below.
- Only return valid JSON
- Never include backtick symbols such as: \`
- The response will be parsed with json.loads(), therefore it must be valid JSON.

QUESTION: 
{question}

QUERIES:
${Object.keys(Object.keys(questions))
  .map((query) => `- ${query}`)
  .join('\n')}
 
FORMAT:
{format_instructions}
`
