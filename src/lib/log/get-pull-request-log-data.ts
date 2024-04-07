type PullRequestData = {
  id: number
  created_at: string
  html_url: string
  title: string
  merged_at: string | null
  number: number
  user?: {
    id: number
    login: string
  } | null
  base: {
    ref: string
    repo: {
      name: string
      html_url: string
      id: number
      default_branch: string
      full_name: string
    }
  }
}

export const getPullRequestLogData = (pullRequest: PullRequestData) => ({
  id: pullRequest.id,
  created_at: pullRequest.created_at,
  html_url: pullRequest.html_url,
  title: pullRequest.title,
  merged_at: pullRequest.merged_at,
  number: pullRequest.number,
  user: {
    id: pullRequest.user?.id,
    login: pullRequest.user?.login,
  },
  base: {
    ref: pullRequest.base.ref,
    repo: {
      id: pullRequest.base.repo.id,
      name: pullRequest.base.repo.name,
      full_name: pullRequest.base.repo.full_name,
      html_url: pullRequest.base.repo.html_url,
    },
  },
})
