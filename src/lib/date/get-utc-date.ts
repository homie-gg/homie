import { addMinutes, setDay, setHours, setMinutes } from 'date-fns'

interface GetUTCDateParams {
  day: number
  hours: number
  minutes: number
}

export function getUTCDate(params: GetUTCDateParams) {
  const { day, hours, minutes } = params

  const utc = setMinutes(setHours(setDay(new Date(), day), hours), minutes)

  const offset = utc.getTimezoneOffset()
  return addMinutes(utc, offset)
}
