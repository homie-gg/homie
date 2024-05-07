import { dbClient } from '@/database/client'
import { ImportGitlabProjects } from '@/queue/jobs'
import { createGitlabClient } from '@/lib/gitlab/create-gitlab-client'

export async function handleImportGitlabProjects(job: ImportGitlabProjects) {
  const { organization } = job.data

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
}
