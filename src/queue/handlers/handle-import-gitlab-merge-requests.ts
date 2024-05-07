import { ImportGitlabMergeRequests } from '@/queue/jobs'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { saveMergedMergeRequest } from '@/lib/gitlab/save-merged-merge-request'

export async function handleImportGitlabMergeRequests(
  job: ImportGitlabMergeRequests,
) {
  const { organization, project } = job.data

  if (!organization) {
    return
  }

  const gitlab = createGitlabClient(organization.gitlab_access_token)

  const projectInfo = await gitlab.Projects.show(project.ext_gitlab_project_id)

  const mergeRequests = await gitlab.MergeRequests.all({
    projectId: project.ext_gitlab_project_id,
    state: 'merged',
    scope: 'all', // not just owned by user
    perPage: 20,
    maxPages: 1,
    targetBranch: projectInfo.default_branch,
  })

  for (const mergeRequest of mergeRequests) {
    await saveMergedMergeRequest({
      mergeRequest,
      organization,
      project,
    })
  }
}
