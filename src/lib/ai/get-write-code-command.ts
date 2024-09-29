import { escapeShellCommand } from '@/lib/shell/escape-shell-command'

interface GetWriteCodeCommandParams {
  instructions: string
  files: string[]
}

export function getWriteCodeCommand(params: GetWriteCodeCommandParams) {
  const { instructions, files } = params

  return [
    'aider',
    '--yes', // confirm
    '--no-attribute-author', // remove 'aider' from git author
    `--message ${escapeShellCommand({
      command: instructions,
    })}`,
    ...files.map((file) => escapeShellCommand({ command: file })),
  ].join(' ')
}
