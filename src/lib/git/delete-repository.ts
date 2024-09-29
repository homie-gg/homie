import { execSync } from 'node:child_process'

interface DeleteRepositoryParams {
  path: string
}

export function deleteRepository(params: DeleteRepositoryParams) {
  const { path } = params

  execSync(`rm -rf ${path}`, {
    stdio: 'inherit',
  })
}
