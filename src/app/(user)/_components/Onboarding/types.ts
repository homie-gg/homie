export interface OnboardingOrganization {
  id: number
  ext_slack_team_id: string | null
  ext_gh_install_id: number | null
  gitlab_access_token: string | null
  owner_name: string | null
}
