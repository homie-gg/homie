export function getHoursDiff(start: Date) {
  const createdAt = start
  const now = new Date()
  const hoursDifference =
    (now.getTime() - createdAt.getTime()) / (1000 * 60 * 60)

  return Math.round(hoursDifference * 100) / 100
}
