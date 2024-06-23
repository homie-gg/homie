interface getAsanaOrganizationLogDataParams {
  id: number
  organization_id: number
  updated_at: Date
  created_at: Date
}

export function getAsanaOrganizationLogData(
  asanaOrganization: getAsanaOrganizationLogDataParams,
) {
  return {
    id: asanaOrganization.id,
    organization_id: asanaOrganization.organization_id,
    created_at: asanaOrganization.created_at,
    updated_at: asanaOrganization.updated_at,
  }
}
