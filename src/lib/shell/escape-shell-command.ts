interface EscapeShellCommandParams {
  command: string
}

export function escapeShellCommand(params: EscapeShellCommandParams) {
  const { command } = params
  return '"' + command.replace(/(["$`\\])/g, '\\$1') + '"'
}
