'use client'

import { http } from '@/lib/http/client/http'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/Select'
import { TableCell, TableRow } from '@/lib/ui/Table'
import { Member } from '@slack/web-api/dist/response/UsersListResponse'
import { useState } from 'react'

interface ContributorRowProps {
  contributor: {
    id: number
    username: string
    ext_slack_member_id: string | null
  }
  slackMembers: Member[]
}

export default function ContributorRow(props: ContributorRowProps) {
  const { contributor, slackMembers } = props
  const [value, setValue] = useState(contributor.ext_slack_member_id ?? '')
  const [processing, setProcessing] = useState(false)
  const { id: contributorId } = contributor

  const setSlackId = (extSlackMemberId: string) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch(`/api/contributors/${contributorId}`, {
        ext_slack_member_id: extSlackMemberId,
      })
      .then(() => {
        setValue(extSlackMemberId)
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{contributor.username}</TableCell>
      <TableCell>
        <Select value={value} onValueChange={setSlackId} disabled={processing}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select a user" />
          </SelectTrigger>
          <SelectContent>
            {slackMembers.map((slackMember, index) => (
              <SelectItem
                value={slackMember.id ?? ''}
                key={slackMember.id ?? index}
              >
                {getDisplayName(slackMember)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
    </TableRow>
  )
}

function getDisplayName(slackMember: Member) {
  if (slackMember.profile?.display_name) {
    return slackMember.profile.display_name
  }

  if (slackMember.profile?.real_name) {
    return slackMember.profile.real_name
  }

  return 'Unknown'
}
