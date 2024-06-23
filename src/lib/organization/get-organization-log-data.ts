type OrganizationData = {
  id: number
  ext_gh_install_id?: number | null
}

export const getOrganizationLogData = (organization: OrganizationData) => ({
  organization_id: organization.id,
  ext_gh_install_id: organization.ext_gh_install_id,
})
