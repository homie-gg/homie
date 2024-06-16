import { Block } from '@slack/bolt'
import { markdownToBlocks } from '@tryfabric/mack'
import htmlEntities from 'he'

export async function formatAnswer(answer: string): Promise<Block[]> {
  const blocks = await markdownToBlocks(answer)
  const blocksString = JSON.stringify(blocks)
  const escapedQuotes = blocksString.replaceAll('&quot;', "'") // to avoid JSON.parse breaking due to "
  const withHtml = htmlEntities.decode(escapedQuotes) // unescape any html entities that might exist. eg. &lt; to '<'

  return JSON.parse(withHtml)
}
