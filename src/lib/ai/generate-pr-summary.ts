import OpenAI from 'openai'

interface GeneratePRSummaryParams {
  title: string
  description: string
  changedFiles: string[]
}

export async function generatePRSummary(params: GeneratePRSummaryParams): Promise<string> {
  const { title, description, changedFiles } = params
  const client = new OpenAI()

  const prompt = `Generate a concise summary for a pull request with the following details:
Title: ${title}
Description: ${description}
Changed files: ${changedFiles.join(', ')}

The summary should be brief, highlighting the main changes and their purpose.`

  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-3.5-turbo',
  })

  return chatCompletion.choices[0].message.content || 'Unable to generate summary.'
}
