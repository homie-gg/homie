import { getGitlabInstallUrl } from '@/lib/gitlab/get-install-gitlab-url'
import { Button } from '@/lib/ui/Button'
import Link from 'next/link'

interface InstallGitlabPageProps {
  organization: {
    id: number
  }
}

export default async function InstallGitlabPage(props: InstallGitlabPageProps) {
  const { organization } = props
  const url = getGitlabInstallUrl({ organization })

  return (
    <Link href={url}>
      <Button>Install Gitlab</Button>
    </Link>
  )
}
