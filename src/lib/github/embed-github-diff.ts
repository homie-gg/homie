import { embedDiff } from '@/lib/ai/embed-diff'

interface EmbedGithubDiff {
  diff: string
  summary: string
  pullRequest: {
    id: number
    title: string
    html_url: string
    ext_gh_pull_request_id: number | null
    github_repo_id: number | null
    contributor_id: number
    merged_at: Date | null
  }
  contributor: string
  organization_id: number
}

export async function embedGithubDiff(params: EmbedGithubDiff) {
  const { diff, summary, pullRequest, organization_id, contributor } = params

  const metadata = {
    type: 'pr_diff',
    organization_id,
    pull_request_id: pullRequest.id,
    ext_gh_pull_request_id: pullRequest.ext_gh_pull_request_id,
    github_repo_id: pullRequest.github_repo_id,
    contributor_id: pullRequest.contributor_id,
  }

  await embedDiff({
    title: pullRequest.title,
    diff,
    summary,
    url: pullRequest.html_url,
    contributor,
    organization_id,
    metadata,
    mergedAt: pullRequest.merged_at,
  })
}
