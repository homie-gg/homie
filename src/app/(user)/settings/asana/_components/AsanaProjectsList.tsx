import AsanaImportProjectsButton from '@/app/(user)/settings/asana/_components/AsanaImportProjectsButton'
import AsanaProjectEnabledSwitch from '@/app/(user)/settings/asana/_components/AsanaProjectEnabledSwitch'
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
  asanaAppUser: {
    asana_access_token: string
  }
  organization: {
    id: number
  }
}

export default async function AsanaProjectsList(props: ConfigureGitlabForm) {
  const { organization } = props

  const projects = await dbClient
    .selectFrom('asana.project')
    .where('organization_id', '=', organization.id)
    .select(['ext_asana_project_id', 'enabled', 'name', 'id'])
    .orderBy('name', 'asc')
    .execute()

  return (
    <div>
      <div className="text-right mb-4">
        <AsanaImportProjectsButton />
      </div>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Project</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {projects.map((project) => (
            <TableRow key={project.ext_asana_project_id}>
              <TableCell>{project.name}</TableCell>
              <TableCell className="text-right">
                <AsanaProjectEnabledSwitch project={project} />
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
