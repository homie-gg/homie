'use client'

import { http } from '@/lib/http/client/http'
import { Button } from '@/lib/ui/Button'
import { toast } from '@/lib/ui/Toast/use-toast'
import { useState } from 'react'

export default function AsanaImportProjectsButton() {
  const [processing, setProcessing] = useState(false)

  const importProjects = () => {
    http
      .post('/api/asana/projects/import', {})
      .then(() => {
        toast({
          title: 'Importing',
          description: 'Asana projects are being imported.',
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
