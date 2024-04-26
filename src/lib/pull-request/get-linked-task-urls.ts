import { linkIssueKeywords } from '@/lib/github/find-linked-github-issue'

interface GetLinkedTaskUrlsParams {
  pullRequestBody: string
}

export function getLinkedTaskUrls(params: GetLinkedTaskUrlsParams): string[] {
  const { pullRequestBody } = params

  const taskUrls: string[] = []

  for (const keyword of linkIssueKeywords) {
    const regex = new RegExp(`${keyword}\\s?(http[s]?\\:([^\\s]+))`, 'gim')
    const matches = pullRequestBody.matchAll(regex)

    for (const match of matches) {
      // eg: https://trello.com/c/k7s3Ri9F/2-create-a-new-card
      // ["closeshttps://trello.com/c/k7s3Ri9F/2-create-a-new-card", "https://trello.com/c/k7s3Ri9F/2-create-a-new-card", "//trello.com/c/k7s3Ri9F/2-create-a-new-card"]
      if (match.length !== 3) {
        continue
      }

      const url = match[1]
      taskUrls.push(url)
    }
  }

  return taskUrls
}
