import { getGreeting } from '@/lib/ai/get-greeting'

interface GetDuplicateTaskMessageParams {
  task: {
    name: string
    html_url: string
  }
}

export function getDuplicateTaskMessage(params: GetDuplicateTaskMessageParams) {
  const { task } = params
  return `${getGreeting()}, this issue might be a duplicate of: [${task.name}](${task.html_url}).`
}
