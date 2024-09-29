import { execSync } from 'node:child_process'

interface CloneRepositoryParams {
  organization: {
    id: number
  }
  url: string
  dirName: string
}

export function cloneRepository(params: CloneRepositoryParams) {
  const { organization, url, dirName } = params

  const orgDir = `organization-${organization.id}`

  const output = execSync(
    [
      'cd /tmp',
      'mkdir -p homie-repos && cd homie-repos',
      `mkdir -p ${orgDir} && cd ${orgDir}`,
      `rm -rf ${dirName}`,
      `git clone ${url} ${dirName}`,
      `cd ${dirName}`,
      'pwd',
    ].join(' && '),
  )

  return output.toString('utf-8').trim()
}
