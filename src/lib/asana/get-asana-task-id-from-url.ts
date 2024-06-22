interface GetAsanaTaskIdFromUrlParams {
  url: string
}

export function getAsanaTaskIdFromUrl(params: GetAsanaTaskIdFromUrlParams) {
  const { url } = params
  if (!url.includes('https://app.asana.com/')) {
    return null
  }

  const matches = url.match(/https:\/\/app.asana.com\/\d+\/\d+\/([^\/]*)/)
  if (matches?.length !== 2) {
    return null
  }

  return matches[1]
}
