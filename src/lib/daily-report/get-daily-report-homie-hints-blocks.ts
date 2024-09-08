import { ChatPostMessageArguments } from '@slack/web-api/dist/methods'
import { sample } from 'lodash'

interface GetDailyReportHomieHintsBlocks {
  pendingTasks: Array<{ name: string; html_url: string }>
  pullRequests: Array<{
    title: string
    contributor_id: number
    html_url: string
  }>
  contributors: Array<{
    username: string
    ext_slack_member_id: string | null
    id: number
  }>
  extSlackBotUserId: string
}

export async function getDailyReportHomieHintsBlocks(
  params: GetDailyReportHomieHintsBlocks,
) {
  const {
    pendingTasks,
    contributors,
    pullRequests,
    extSlackBotUserId,
  } = params

  const hintsBlocks: ChatPostMessageArguments['blocks'] = [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: 'Homie ⚡️',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'plain_text',
        text: 'Do more with Homie, try out some of these commands:',
      },
    },
  ]

  const hints: string[] = []

  // Explain PR
  const randomPullRequest = sample(pullRequests)
  if (randomPullRequest) {
    hints.push(`<@${extSlackBotUserId}> explain PR ${randomPullRequest.title}`)
  }

  // Assign a task
  const contributorToAssign = sample(contributors)
  const taskToAssign = sample(pendingTasks)
  if (
    contributorToAssign &&
    contributorToAssign.ext_slack_member_id &&
    taskToAssign
  ) {
    hints.push(
      `<@${extSlackBotUserId}> assign ${taskToAssign.name} to <@${contributorToAssign.ext_slack_member_id}>`,
    )
  }

  // Generate changelog
  hints.push(`<@${extSlackBotUserId}> generate changelog for PRs above.`)

  // Turn PR into blogpost
  const blogPostPR = sample(pullRequests)
  if (blogPostPR) {
    hints.push(
      `<@${extSlackBotUserId}> turn PR ${blogPostPR.title} into a blog post.`,
    )
  }

  // Remember slack thread
  hints.push(`<@${extSlackBotUserId}> remember this conversation.`)

  // Ask if a bug was fixed
  hints.push(`<@${extSlackBotUserId}> did we fix <some bug>?`)

  // Find all PRs related to some topic
  hints.push(`<@${extSlackBotUserId}> find all PRs for <some topic>`)

  for (const hint of hints) {
    hintsBlocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `• ${hint}`,
      },
    })
  }

  hintsBlocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: 'Check out the <https://homie.gg/docs/getting-started|docs> for more features.',
    },
  })

  return hintsBlocks
}
