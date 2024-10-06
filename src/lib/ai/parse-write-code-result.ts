import OpenAI from 'openai'
import { zodResponseFormat } from 'openai/helpers/zod'
import { z } from 'zod'

interface ParseWriteCodeOutputParams {
  output: string
}

type ParseWriteCodeResult =
  | {
      failed: true
      prompt: string
      error: string
    }
  | {
      failed: false
      prompt: string
      was_successful: boolean
      title: string
      description: string
    }

const parseWriteCodeOutputResponse = z.object({
  was_successful: z.boolean(),
  title: z.string(),
  description: z.string(),
})

export async function parseWriteCodeResult(
  params: ParseWriteCodeOutputParams,
): Promise<ParseWriteCodeResult> {
  const { output } = params

  const client = new OpenAI()

  const prompt = `Resummarize the following CODE CHANGES. 
- Generate a single sentence for the title, and use bullet points for the DESCRIPTION.
- Determine whether the code changes were successful and return it as a boloean udner 'was_successful'
- DO NOT include any information about aider

CODE CHANGES:
${output}`

  const chatCompletion = await client.beta.chat.completions.parse({
    messages: [
      { role: 'system', content: 'You are an experienced software engineer.' },
      {
        role: 'user',
        content: prompt,
      },
    ],
    model: 'gpt-4o-2024-08-06',
    response_format: zodResponseFormat(
      parseWriteCodeOutputResponse,
      'parseWriteCodeOutputResponse',
    ),
  })

  const message = chatCompletion.choices[0].message
  if (!message?.parsed || message.refusal) {
    return {
      failed: true,
      prompt,
      error: message.refusal ?? 'Failed to get parsed output',
    }
  }

  return {
    failed: false,
    prompt,
    was_successful: message.parsed.was_successful,
    title: message.parsed.title,
    description: message.parsed.description,
  }
}
