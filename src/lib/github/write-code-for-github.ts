import { dbClient } from '@/database/client'
import { findWriteCodeTargetFiles } from '@/lib/ai/find-write-code-target-files'
import { getWriteCodeCommand } from '@/lib/ai/get-write-code-command'
import { cloneRepository } from '@/lib/git/clone-repository'
import { deleteRepository } from '@/lib/git/delete-repository'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getGithubDefaultBranch } from '@/lib/github/get-default-branch'
import { getGithubAccessToken } from '@/lib/github/get-github-access-token'
import { execSync } from 'child_process'

interface WriteCodeForGithubParams {
  id: string
  instructions: string
  githubRepoId: number
  organization: {
    id: number
    ext_gh_install_id: number
  }
  files: string[]
}

// TODO
// - may need to create tools to list repos to help AI figure out which to use
// - write PR title & body, maybe from anthropic output?
// - handle gitlab
// - include diff as context?

export async function writeCodeForGithub(params: WriteCodeForGithubParams) {
  const { id, instructions, githubRepoId, organization, files } = params

  const github = await createGithubClient({
    installationId: organization.ext_gh_install_id,
  })

  const accessToken = await getGithubAccessToken({
    github,
  })

  const repo = await dbClient
    .selectFrom('github.repo')
    .where('organization_id', '=', organization.id)
    .where('id', '=', githubRepoId)
    .select(['owner', 'github.repo.name', 'id'])
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
    execSync(
      getWriteCodeCommand({
        instructions,
        files,
      }),
      {
        stdio: 'inherit', // output to console
        cwd: directory,
      },
    )

    const branch = `homie-${id}`

    try {
      execSync(`git branch -D ${branch}`, { cwd: directory })
    } catch {
      // ignore errors
    }

    try {
      execSync(`git checkout -b ${branch}`, { cwd: directory })
    } catch {
      // ignore erorrs
    }

    const currentBranch = execSync('git rev-parse --abbrev-ref HEAD', {
      cwd: directory,
    })
      .toString()
      .trim()

    if (currentBranch !== branch) {
      throw new Error(`Could not checkout git branch: ${branch}`)
    }

    // Push the branch to remote
    execSync(`git push origin ${branch}`, {
      cwd: directory,
    })

    const defaultBranch = await getGithubDefaultBranch({
      github,
      repo: {
        name: repo.name,
        owner: repo.owner,
      },
    })

    // Open PR
    const res = await github.rest.pulls.create({
      owner: repo.owner,
      repo: repo.name,
      title: 'First issue fix',
      body: 'This PR does something for your',
      base: defaultBranch,
      head: branch,
    })

    console.log('PR URL: ', res.data.html_url)

    deleteRepository({ path: directory })

    return {
      title: res.data.title,
      html_url: res.data.html_url,
    }
  } catch (error) {
    console.error('ERROR: ', error)
    deleteRepository({ path: directory })
    throw error
  }
}
