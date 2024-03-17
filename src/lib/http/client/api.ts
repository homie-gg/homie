export function api(path: string) {
  return process.env.NEXT_PUBLIC_APP_URL + `/api${path}`
}
