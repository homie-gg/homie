'use client'

import { AsanaUser } from '@/lib/asana/types'
import { http } from '@/lib/http/client/http'
import { getSlackDisplayName } from '@/lib/slack/get-slack-display-name'
import { TrelloMember } from '@/lib/trello/types'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/lib/ui/Select'
import { TableCell, TableRow } from '@/lib/ui/Table'
import { Member as SlackMember } from '@slack/web-api/dist/response/UsersListResponse'
import { useState } from 'react'

interface ContributorRowProps {
  contributor: {
    id: number
    username: string
    ext_slack_member_id: string | null
    ext_trello_member_id: string | null
    ext_asana_user_id: string | null
  }
  slackMembers: SlackMember[]
  trelloMembers: TrelloMember[] | null
  asanaUsers: AsanaUser[] | null
}

export default function ContributorRow(props: ContributorRowProps) {
  const { contributor, slackMembers, trelloMembers, asanaUsers } = props
  const [slackMemberId, setSlackMemberId] = useState(
    contributor.ext_slack_member_id ?? '',
  )
  const [trelloMemberId, setTrelloMemberId] = useState(
    contributor.ext_trello_member_id ?? '',
  )
  const [asanaUserId, setAsanaUserId] = useState(
    contributor.ext_asana_user_id ?? '',
  )
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
        setSlackMemberId(extSlackMemberId)
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  const setTrelloMember = (extTrelloMemberId: string) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch(`/api/contributors/${contributorId}`, {
        ext_trello_member_id: extTrelloMemberId,
      })
      .then(() => {
        setTrelloMemberId(extTrelloMemberId)
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  const setAsanaUser = (extAsanaUserId: string) => {
    if (processing) {
      return
    }

    setProcessing(true)

    http
      .patch(`/api/contributors/${contributorId}`, {
        ext_asana_user_id: extAsanaUserId,
      })
      .then(() => {
        setAsanaUserId(extAsanaUserId)
      })
      .finally(() => {
        setProcessing(false)
      })
  }

  return (
    <TableRow>
      <TableCell className="font-medium">{contributor.username}</TableCell>
      <TableCell>
        <Select
          value={slackMemberId}
          onValueChange={setSlackId}
          disabled={processing}
        >
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Select one" />
          </SelectTrigger>
          <SelectContent>
            {slackMembers.map((slackMember, index) => (
              <SelectItem
                value={slackMember.id ?? ''}
                key={slackMember.id ?? index}
              >
                {getSlackDisplayName(slackMember)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </TableCell>
      {trelloMembers && (
        <TableCell>
          <Select
            value={trelloMemberId}
            onValueChange={setTrelloMember}
            disabled={processing}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {trelloMembers.map((trelloMember) => (
                <SelectItem value={trelloMember.id} key={trelloMember.id}>
                  {`${trelloMember.fullName} (${trelloMember.username})`}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
      {asanaUsers && (
        <TableCell>
          <Select
            value={asanaUserId}
            onValueChange={setAsanaUser}
            disabled={processing}
          >
            <SelectTrigger className="w-[240px]">
              <SelectValue placeholder="Select one" />
            </SelectTrigger>
            <SelectContent>
              {asanaUsers.map((asanaUser) => (
                <SelectItem value={asanaUser.gid} key={asanaUser.gid}>
                  {asanaUser.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </TableCell>
      )}
    </TableRow>
  )
}
