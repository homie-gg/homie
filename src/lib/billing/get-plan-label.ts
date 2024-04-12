import { Plan } from '@/lib/db/types'

export function getPlanLabel(plan: Plan['name']) {
  switch (plan) {
    case 'basic':
      return 'Basic'
    case 'team':
      return 'Team'
    case 'agency':
      return 'Agency'
  }
}
