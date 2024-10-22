import OpenAI from 'openai'

export async function generatePRSummary(
  title: string,
  description: string,
  changes: string
): Promise<string> {
  const client = new OpenAI()

  const prompt = `Summarize the following pull request:
Title: ${title}
Description: ${description}
Changes:
${changes}

Provide a concise summary of the changes, their purpose, and any potential impact.`

  const chatCompletion = await client.chat.completions.create({
    messages: [
      { role: 'system', content: 'You are a helpful assistant that summarizes pull requests.' },
      { role: 'user', content: prompt }
    ],
    model: 'gpt-4',
  })

  return chatCompletion.choices[0].message.content || 'Unable to generate summary.'
}
