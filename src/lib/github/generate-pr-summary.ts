import OpenAI from 'openai'
import { z } from 'zod'
import { zodResponseFormat } from 'openai/helpers/zod'

const prSummarySchema = z.object({
  summary: z.string(),
  impact: z.string(),
  testing_notes: z.string(),
})

export async function generatePRSummary(
  prDescription: string,
  files: string[],
): Promise<string> {
  const client = new OpenAI()

  const prompt = `Summarize the following pull request:
  
Description:
${prDescription}

Files changed:
${files.join('\n')}

Provide a concise summary, potential impact, and testing notes.`

  const chatCompletion = await client.beta.chat.completions.parse({
    messages: [
      { role: 'system', content: 'You are an experienced software engineer.' },
      { role: 'user', content: prompt },
    ],
    model: 'gpt-4-1106-preview',
    response_format: zodResponseFormat(prSummarySchema, 'prSummarySchema'),
  })

  const message = chatCompletion.choices[0].message
  if (!message?.parsed || message.refusal) {
    throw new Error(message.refusal ?? 'Failed to generate PR summary')
  }

  return `## Summary
${message.parsed.summary}

## Potential Impact
${message.parsed.impact}

## Testing Notes
${message.parsed.testing_notes}`
}
