'use client'

import { http } from '@/lib/http/client/http'
import { Switch } from '@/lib/ui/Switch'
import { useState } from 'react'

interface GitlabProjectEnabledSwitchProps {
  project: {
    id: number
    enabled: boolean
  }
}

export default function GitlabProjectEnabledSwitch(
  props: GitlabProjectEnabledSwitchProps,
) {
  const { project } = props
  const [enabled, setEnabled] = useState(project.enabled)
  const [processing, setProcessing] = useState(false)

  const handleChangeEnabled = (updatedEnabled: boolean) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch(`/api/gitlab/projects/${project.id}`, {
        enabled: updatedEnabled,
      })
      .then(() => {
        setEnabled(updatedEnabled)
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  return (
    <Switch
      checked={enabled}
      onCheckedChange={handleChangeEnabled}
      disabled={processing}
    />
  )
}
