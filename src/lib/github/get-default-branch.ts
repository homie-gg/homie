import { GithubClient } from '@/lib/github/create-github-client'

interface GetGithubDefaultBranchParams {
  github: GithubClient
  repo: {
    owner: string
    name: string
  }
}

export async function getGithubDefaultBranch(
  params: GetGithubDefaultBranchParams,
): Promise<string> {
  const { github, repo } = params

  const res = await github.rest.repos.get({
    owner: repo.owner,
    repo: repo.name,
  })

  return res.data.default_branch
}
