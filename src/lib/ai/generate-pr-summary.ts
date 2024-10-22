import OpenAI from 'openai'
import { PullRequest } from '@/app/(user)/pull_requests/_utils/get-pull-requests'

export async function generatePRSummary(pr: PullRequest): Promise<string> {
  const client = new OpenAI()

  const prompt = `Summarize the following pull request:
Title: ${pr.title}
Description: ${pr.body}
Files changed: ${pr.changed_files}
Additions: ${pr.additions}
Deletions: ${pr.deletions}

Please provide a concise summary of the changes, their purpose, and any potential impact.`

  const chatCompletion = await client.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: 'gpt-4',
  })

  return (
    chatCompletion.choices[0].message.content || 'Unable to generate summary.'
  )
}
