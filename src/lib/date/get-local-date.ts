import { getDate } from '@/lib/date/get-date'
import { subMinutes } from 'date-fns'

interface GetLocalDateParams {
  day?: number
  hours: number
  minutes: number
}

export function getLocalDate(params: GetLocalDateParams) {
  const { day, hours, minutes } = params

  const utc = getDate({
    day,
    hours,
    minutes,
  })

  const offset = utc.getTimezoneOffset()
  return subMinutes(utc, offset)
}
