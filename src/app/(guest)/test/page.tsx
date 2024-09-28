import { writeCode } from '@/queue/jobs/write-code'

export default async function TestPage() {
  await writeCode.dispatch(
    {
      organization_id: 1,
      instructions: `{
      update nav color to blue
    }`,
      github_repo_id: 1,
    },
    {
      attempts: 1,
    },
  )
  return <div>hello</div>
}
