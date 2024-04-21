import { setDay, setHours, setMinutes, subMinutes } from 'date-fns'

interface GetLocalDateParams {
  day: number
  hours: number
  minutes: number
}

export function getLocalDate(params: GetLocalDateParams) {
  const { day, hours, minutes } = params

  const utc = setMinutes(setHours(setDay(new Date(), day), hours), minutes)

  const offset = utc.getTimezoneOffset()
  return subMinutes(utc, offset)
}
