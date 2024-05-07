'use client'

import { http } from '@/lib/http/client/http'
import { Button } from '@/lib/ui/Button'
import { toast } from '@/lib/ui/Toast/use-toast'
import { useState } from 'react'

interface GitlabImportProjectsButtonProps {}

export default function GitlabImportProjectsButton(
  props: GitlabImportProjectsButtonProps,
) {
  const [processing, setProcessing] = useState(false)
  const {} = props

  const importProjects = () => {
    http
      .post('/api/gitlab/projects/import', {})
      .then(() => {
        toast({
          title: 'Importing',
          description: 'Gitlab projects are being imported.',
        })
      })
      .catch(() => {
        toast({
          title: 'Error: could not import projects',
          variant: 'destructive',
        })
      })
      .finally(() => {
        setProcessing(false)
      })
  }
  return (
    <Button variant="outline" disabled={processing} onClick={importProjects}>
      Import projects
    </Button>
  )
}
