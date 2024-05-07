import GitlabImportProjectsButton from '@/app/(user)/settings/gitlab/_components/GitlabImportProjectsButton'
import GitlabProjectEnabledSwitch from '@/app/(user)/settings/gitlab/_components/GitlabProjectEnabledSwitch'
import { dbClient } from '@/database/client'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/lib/ui/Table'

interface ConfigureGitlabForm {
  gitlabAppUser: {
    gitlab_access_token: string
  }
  organization: {
    id: number
  }
}

export default async function GitlabProjectsList(props: ConfigureGitlabForm) {
  const { organization } = props

  const projects = await dbClient
    .selectFrom('gitlab.project')
    .where('organization_id', '=', organization.id)
    .select(['gitlab.project.ext_gitlab_project_id', 'enabled', 'name', 'id'])
    .orderBy('name', 'asc')
    .execute()

  return (
    <div>
      <div className="text-right mb-4">
        <GitlabImportProjectsButton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.ext_gitlab_project_id}>
              <TableCell>{project.name}</TableCell>
              <TableCell className="text-right">
                <GitlabProjectEnabledSwitch project={project} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
