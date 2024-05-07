interface GetMergeRequestLogDataParams {
  id: number
  created_at: string
  title: string
  web_url?: string | null
  merged_at?: string | null
  closed_at?: string | null
  description?: string | null
}

export function getMergeRequestLogData(
  mergeRequest: GetMergeRequestLogDataParams,
) {
  return {
    ext_gitlab_merge_request_id: mergeRequest.id,
    created_at: mergeRequest.created_at,
    title: mergeRequest.title,
    web_url: mergeRequest.web_url,
    merged_at: mergeRequest.merged_at,
    closed_at: mergeRequest.closed_at,
    description: mergeRequest.description,
  }
}
