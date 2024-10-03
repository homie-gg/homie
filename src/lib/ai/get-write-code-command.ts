import { escapeShellCommand } from '@/lib/shell/escape-shell-command'

interface GetWriteCodeCommandParams {
  instructions: string
  files: string[]
}

export function getWriteCodeCommand(params: GetWriteCodeCommandParams) {
  const { instructions, files } = params

  const args = [
    'aider',
    '--yes', // confirm
    '--no-attribute-author', // remove 'aider' from git author
    `--message ${escapeShellCommand({
      command: instructions,
    })}`,
  ]

  if (files.length > 0) {
    args.push(...files.map((file) => escapeShellCommand({ command: file })))
  }

  return args.join(' ')
}
