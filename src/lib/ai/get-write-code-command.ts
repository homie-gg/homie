import { escapeShellCommand } from '@/lib/shell/escape-shell-command'

interface GetWriteCodeCommandParams {
  instructions: string
}

export function getWriteCodeCommand(params: GetWriteCodeCommandParams) {
  const { instructions } = params

  return `aider --yes --message ${escapeShellCommand({
    command: instructions,
  })}`
}
