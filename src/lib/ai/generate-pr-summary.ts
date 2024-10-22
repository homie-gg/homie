import OpenAI from 'openai'

export async function generatePRSummary(description: string): Promise<string> {
  const client = new OpenAI()

  const prompt = `Summarize the following pull request description in a concise manner:

${description}

Provide a brief summary that highlights the main changes and their purpose.`

  const chatCompletion = await client.chat.completions.create({
    messages: [
      {
        role: 'system',
        content: 'You are a helpful assistant that summarizes pull requests.',
      },
      { role: 'user', content: prompt },
    ],
    model: 'gpt-4',
  })

  return (
    chatCompletion.choices[0].message.content || 'Unable to generate summary.'
  )
}
