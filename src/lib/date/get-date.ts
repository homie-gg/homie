import { setDay, setHours, setMinutes } from 'date-fns'

interface GetDateParams {
  day: number
  hours: number
  minutes: number
}

export function getDate(params: GetDateParams) {
  const { day, hours, minutes } = params

  return setMinutes(setHours(setDay(new Date(), day), hours), minutes)
}
