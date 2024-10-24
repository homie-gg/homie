import { format } from 'date-fns'

export const getCurrentTime = () => {
  return format(new Date(), 'HH:mm z')
}
