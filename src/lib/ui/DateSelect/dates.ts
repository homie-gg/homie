export const daysFilter = ['7', '28', '90'] as const
export type Days = (typeof daysFilter)[number]
type DaysLabels = {
  [k in Days]: string
}

export const daysLabels: DaysLabels = {
  7: 'Past 7 days',
  28: 'Past 4 weeks',
  90: 'Past 3 months',
}
