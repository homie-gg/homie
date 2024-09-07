import { dispatch } from '@/queue/dispatch'

interface TestPageProps {}

export default async function TestPage(props: TestPageProps) {
  const {} = props

  await dispatch('send_daily_reports', null)

  return <div>{new Date().getSeconds()}</div>
}
