export const taskPriority = {
  critical_bug: 0,
  important: 1,
  normal: 2,
  nice_to_have: 3,
} as const

export const getPriorityLabel = (level: number) => {
  switch (level) {
    case 0:
      return 'Critical Bug'
    case 1:
      return 'High'
    case 2:
      return 'Medium'
    case 3:
      return 'Low'
  }
}
