import { createGithubClient } from '@/lib/github/create-github-client'

interface ListPullRequestCommitsParams {
  installationId: number
  repo: string
  owner: string
  pullRequestNumber: number
}

export async function listPullRequestCommits(
  params: ListPullRequestCommitsParams,
) {
  const { installationId, repo, owner, pullRequestNumber } = params

  const github = await createGithubClient({
    installationId,
  })

  const { data } = await github.rest.pulls.listCommits({
    pull_number: pullRequestNumber,
    repo: repo,
    owner,
  })

  return data.map((commit) => ({
    author: commit.author?.login,
    message: commit.commit.message,
    created_at: commit.commit.author?.date,
  }))
}
