interface GetGitlabAppUserLogData {
  id: number
  organization_id: number
  updated_at: Date
  created_at: Date
}

export function getGitlabAppUserLogData(
  gitlabAppUser: GetGitlabAppUserLogData,
) {
  return {
    id: gitlabAppUser.id,
    organization_id: gitlabAppUser.organization_id,
    created_at: gitlabAppUser.created_at,
    updated_at: gitlabAppUser.updated_at,
  }
}
