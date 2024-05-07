import { embedDiff } from '@/lib/ai/embed-diff'

interface EmbedGitlabDiff {
  diff: string
  summary: string
  pullRequest: {
    id: number
    title: string
    html_url: string
    ext_gitlab_merge_request_id: number | null
    gitlab_project_id: number | null
    contributor_id: number
    merged_at: Date | null
  }
  contributor: string
  organization_id: number
}

export async function embedGitlabDiff(params: EmbedGitlabDiff) {
  const { diff, summary, pullRequest, organization_id, contributor } = params

  const metadata = {
    type: 'mr_diff',
    organization_id,
    pull_request_id: pullRequest.id,
    ext_gitlab_merge_request_id: pullRequest.ext_gitlab_merge_request_id,
    gitlab_project_id: pullRequest.gitlab_project_id,
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
