export function getCurrentTime(tz: string) {
  return new Date().toLocaleString('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}
