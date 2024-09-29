import { dbClient } from '@/database/client'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { getGithubAccessToken } from '@/lib/github/get-github-access-token'
import { execSync } from 'child_process'
import { cwd } from 'process'

interface WriteCodeForGithubParams {
  id: string
  instructions: string
  githubRepoId: number
  organization: {
    id: number
    ext_gh_install_id: number
  }
}

export async function writeCodeForGithub(params: WriteCodeForGithubParams) {
  const { id, instructions, githubRepoId, organization } = params

  const accessToken = await getGithubAccessToken({
    organization: {
      ext_gh_install_id: organization.ext_gh_install_id,
    },
  })

  const repo = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('id', '=', githubRepoId)
    .select(['owner', 'github.repo.name'])
    .executeTakeFirst()

  if (!repo || !repo.owner) {
    throw new Error('Missing repo info')
  }

  const gitCloneUrl = `https://x-access-token:${accessToken}@github.com/${repo.owner}/${repo.name}.git`

  const directory = cloneRepository({
    organization,
    url: gitCloneUrl,
    dirName: id,
  })

  try {
    execSync(getWriteCodeCommand({ instructions }), {
      stdio: 'inherit', // output to console
      cwd: directory,
    })
  } catch (error) {
    console.error('ERROR: ', error)
    deleteRepository({ path: directory })
    throw error
  }

  // TODO: create new branch

  console.log('wrote some code...')
  // deleteRepository({ path: directory })
}
