import { createJob } from '@/queue/create-job'
import { dbClient } from '@/database/client'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

export const importGitlabProjects = createJob({
  id: 'import_gitlab_projects',
  handle: async (payload: {
    organization: {
      id: number
      gitlab_access_token: string
      gitlab_webhook_secret: string
    }
  }) => {
    const { organization } = payload

    const gitlab = createGitlabClient(organization.gitlab_access_token)
    const groups = await gitlab.Groups.all()

    for (const group of groups) {
      const result = await gitlab.Groups.allProjects(group.id, {
        showExpanded: true,
      })

      for (const project of result.data) {
        await dbClient
          .insertInto('gitlab.project')
          .values({
            organization_id: organization.id,
            name: project.name_with_namespace,
            web_url: project.web_url,
            ext_gitlab_project_id: project.id,
          })
          .onConflict((oc) =>
            oc.column('ext_gitlab_project_id').doUpdateSet({
              organization_id: organization.id,
              name: project.name_with_namespace,
              web_url: project.web_url,
            }),
          )
          .executeTakeFirstOrThrow()
      }
    }
  },
})
