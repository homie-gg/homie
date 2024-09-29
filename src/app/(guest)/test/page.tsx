import { writeCode } from '@/queue/jobs/write-code'
import crypto from 'node:crypto'

export default async function TestPage() {
  await writeCode.dispatch(
    {
      organization_id: 1,
      instructions: `{
      update navbar color to blue
    }`,
      github_repo_id: 1,
    },
    {
      attempts: 1,
    },
  )
  return <div>hello</div>
}
