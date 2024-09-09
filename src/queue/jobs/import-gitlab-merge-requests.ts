import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'
import { dispatch } from '@/queue/dispatch'
import { createJob } from '@/queue/create-job'

export const importGitlabMergeRequests = createJob({
  id: 'import_gitlab_merge_requests',
  handle: async (payload: {
    project: {
      id: number
      ext_gitlab_project_id: number
    }
    organization: {
      id: number
      gitlab_access_token: string
      trello_access_token: string | null
      asana_access_token: string | null
      slack_access_token: string | null
      has_unlimited_usage: boolean | null
    }
  }) => {
    const { organization, project } = payload

    if (!organization) {
      return
    }

    const gitlab = createGitlabClient(organization.gitlab_access_token)

    const projectInfo = await gitlab.Projects.show(
      project.ext_gitlab_project_id,
    )

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
        project: {
          default_branch: projectInfo.default_branch,
        },
      })
    }
  },
})
