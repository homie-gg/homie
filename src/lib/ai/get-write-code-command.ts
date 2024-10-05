import { escapeShellCommand } from '@/lib/shell/escape-shell-command'

interface GetWriteCodeCommandParams {
  instructions: string
  files: string[]
  context: string | null
}

export function getWriteCodeCommand(params: GetWriteCodeCommandParams) {
  const { instructions, files, context } = params

  let command = instructions

  console.log('INSTRUCTIONS: ')
  console.log(instructions)

  console.log('CONTEXT: ')
  console.log(context)

  if (context) {
    command += `\nUse the following context to help write the code by following code style, conventions, and references.`
  }

  const args = [
    'aider',
    '--yes', // confirm
    '--no-attribute-author', // remove 'aider' from git author
    `--message ${escapeShellCommand({
      command,
    })}`,
  ]

  if (files.length > 0) {
    args.push(...files.map((file) => escapeShellCommand({ command: file })))
  }

  return args.join(' ')
}
