'use client'

import { GithubPullRequest } from '@/app/api/github/pull_requests/route'
import { api } from '@/lib/http/client/api'
import { http } from '@/lib/http/client/http'
import React, { useCallback, useEffect } from 'react'
import { PropsWithChildren, useState } from 'react'
import { DateRange } from 'react-day-picker'

interface PullRequestsProviderProps extends PropsWithChildren {
  from: Date
  to: Date
  initialValue: GithubPullRequest[]
}

interface PullRequestsContextProps {
  date: DateRange
  setDate: (date: DateRange | undefined) => void
  pullRequests: GithubPullRequest[]
}

const PullRequestsContext = React.createContext<
  PullRequestsContextProps | undefined
>(undefined)

export default function PullRequestsProvider(props: PullRequestsProviderProps) {
  const { from, to, children } = props

  const [pullRequests, setPullRequests] = useState<GithubPullRequest[]>(
    props.initialValue,
  )

  const [date, setDate] = useState<DateRange>({
    from,
    to,
  })

  const setNonNullableDate = useCallback((date: DateRange | undefined) => {
    // Ignore null values
    if (!date) {
      return
    }

    setDate(date)
  }, [])

  useEffect(() => {
    if (!date?.from || !date?.to) {
      return
    }
    http
      .get<{
        pull_requests: GithubPullRequest[]
      }>(
        api(
          `/github/pull_requests?from=${date.from.toISOString()}&to=${date.to.toISOString()}`,
        ),
      )
      .then((data) => {
        setPullRequests(data.pull_requests)
      })
  }, [date])

  return (
    <PullRequestsContext.Provider
      value={{ date, setDate: setNonNullableDate, pullRequests }}
    >
      {children}
    </PullRequestsContext.Provider>
  )
}

export function usePullRequests() {
  const context = React.useContext(PullRequestsContext)
  if (!context) {
    throw new Error(
      'usePullRequests must be used within a PullRequestsProvider',
    )
  }

  return context
}

const numTopContributors = 5

export function useContributors() {
  const { pullRequests } = usePullRequests()

  const [contributors, setContributors] = useState<
    {
      userId: number
      prCount: number
    }[]
  >([])

  useEffect(() => {
    const updated: Record<string, number> = {}

    for (const pullRequest of pullRequests) {
      const currentCount = updated[pullRequest.user_id] ?? 0
      updated[pullRequest.user_id] = currentCount + 1
    }

    const sorted = Object.entries(updated)
      .map(([id, prCount]) => ({
        userId: parseInt(id),
        prCount,
      }))
      .sort((a, b) => b.prCount - a.prCount) // ascending

    setContributors(sorted)
  }, [pullRequests])

  const topContributors = contributors.filter(
    (_c, index) => index < numTopContributors,
  )

  return { contributors, topContributors }
}
