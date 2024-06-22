interface GetShortIdFromCardUrlParams {
  url: string
}

export function getTrelloShortIdFromCardUrl(
  params: GetShortIdFromCardUrlParams,
) {
  const { url } = params
  if (!url.includes('https://trello.com/c')) {
    return null
  }

  const matches = url.match(/https:\/\/trello.com\/c\/([^\/]*)/)
  if (matches?.length !== 2) {
    return null
  }

  return matches[1]
}
