import { escapeShellCommand } from '@/lib/shell/escape-shell-command'

interface GetUpdateCodeFileCommandParams {
  instructions: string
  file: string
  lineNumber?: number
}

export function getUpdateCodeFileCommand(
  params: GetUpdateCodeFileCommandParams,
) {
  const { instructions, file, lineNumber } = params

  const command = lineNumber
    ? `update line number ${lineNumber} to do the following: ${instructions}.`
    : instructions

  const args = [
    'aider',
    '--yes', // confirm
    '--no-attribute-author', // remove 'aider' from git author
    `--message ${escapeShellCommand({
      command,
    })}`,
    escapeShellCommand({ command: file }),
  ]

  return args.join(' ')
}
