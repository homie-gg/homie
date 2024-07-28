export interface SlackLink {
  channelID: string
  messageTS: string
  threadTS: string | null
}

interface GetSlackLinksParams {
  pullRequestBody: string | null
}

export function getSlackLinks(params: GetSlackLinksParams): SlackLink[] {
  const { pullRequestBody } = params
  if (!pullRequestBody) {
    return []
  }

  const regex = `(slack.com\/archives\/)([^\/]*)\/(.*)$`

  const urlRegex = new RegExp(regex, 'gm') // array of URLs. e.g. ['slack.com/archives/foo/232', 'slack.com/archives/bar/123']

  const slackUrls = pullRequestBody?.match(urlRegex)

  if (!slackUrls || slackUrls?.length === 0) {
    return []
  }

  const results: SlackLink[] = []

  for (const url of slackUrls) {
    const partsRegex = new RegExp(regex)

    const urlParts = url.match(partsRegex)

    if (!urlParts || urlParts?.length !== 4) {
      // Invalid URL
      continue
    }

    // Parse out channel ID and message TS (Slack identifier) via URL
    // Reference: https://stackoverflow.com/questions/46355373/get-a-messages-ts-value-from-archives-link

    const channelID = urlParts[2]

    const tsPart = urlParts[3]
    const tsString = tsPart.includes('?') ? tsPart.split('?')[0] : tsPart
    const ts = tsString // e.g. p1234567898000159
      .replaceAll(/[a-z]/g, '') // Remove any characters. e.g. 'p'
      .replace(/(.{10})/, '$1.') // Insert '.' af:ter 10th digit. e.g. 1234567898.000159

    const queryParams = tsPart.includes('?')
      ? new URLSearchParams(tsPart.split('?')[1])
      : new URLSearchParams()

    const threadTS = queryParams.get('thread_ts')

    results.push({
      channelID,
      messageTS: ts,
      threadTS,
    })
  }

  return results
}
