interface GetProjectLogData {
  id: number
  name: string
  ext_gitlab_project_id: number
  enabled: boolean
}

export function getProjectLogData(project: GetProjectLogData) {
  return {
    id: project.id,
    name: project.name,
    ext_gitlab_project_id: project.ext_gitlab_project_id,
    enabled: project.enabled,
  }
}
