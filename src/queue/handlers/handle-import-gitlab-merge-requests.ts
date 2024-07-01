import { ImportGitlabMergeRequests } from '@/queue/jobs'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { dispatch } from '@/queue/default-queue'

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
    await dispatch('save_merged_merge_request', {
      merge_request: {
        created_at: mergeRequest.created_at,
        id: mergeRequest.id,
        iid: mergeRequest.iid,
        title: mergeRequest.title,
        target_project_id: mergeRequest.target_project_id,
        author_id: mergeRequest.author.id,
        description: mergeRequest.description,
      },
      organization,
    })
  }
}
