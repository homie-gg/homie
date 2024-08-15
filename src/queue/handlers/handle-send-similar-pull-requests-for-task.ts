import { dbClient } from '@/database/client'
import { checkIsReferencePullRequest } from '@/lib/ai/check-is-reference-pull-request'
import { PullRequestChangeMetadata } from '@/lib/ai/embed-pull-request-changes'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { postSimilarPullRequestsAsanaTaskComment } from '@/lib/asana/post-similar-pull-requests-asana-task-comment'
import { postSimilarPullRequestsGithubIssueComment } from '@/lib/github/post-similar-pull-requests-github-issue-comment'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { taskStatus } from '@/lib/tasks'
import { postSimilarPullRequestsTrelloTaskComment } from '@/lib/trello/post-similar-pull-requests-trello-comment'
import { SendSimilarPullRequestsForTask } from '@/queue/jobs'
import { CohereClient } from 'cohere-ai'

/**
 * Cohere relevance score. If a PR's relevance score is above this, we'll
 * consider it to be relevant enoughf or the task.
 */
const similarPullRequestScoreThreshold = 0.5

const maxNumPullRequestsToSend = 3

export async function handleSendSimilarPullRequestsForTask(
  job: SendSimilarPullRequestsForTask,
) {
  const { task } = job.data

  // Fetch latest task to make sure this job is still required as it
  // may have been dispatched hours ago.
  const currentTask = await dbClient
    .selectFrom('homie.task')
    .where('id', '=', task.id)
    .select(['has_received_similar_pull_requests', 'task_status_id'])
    .executeTakeFirst()

  if (
    !currentTask ||
    currentTask.has_received_similar_pull_requests ||
    currentTask.task_status_id === taskStatus.done
  ) {
    // no longer required
    return
  }

  const organization = await dbClient
    .selectFrom('homie.organization')
    .leftJoin(
      'github.organization',
      'github.organization.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'asana.app_user',
      'asana.app_user.organization_id',
      'homie.organization.id',
    )
    .leftJoin(
      'trello.workspace',
      'trello.workspace.organization_id',
      'homie.organization.id',
    )
    .where('homie.organization.id', '=', task.organization_id)
    .select([
      'homie.organization.id',
      'ext_gh_install_id',
      'asana.app_user.asana_access_token',
      'trello.workspace.trello_access_token',
    ])
    .executeTakeFirstOrThrow()

  logger.debug('Send similar pull requests', {
    event: 'send_similar_pull_requests:start',
    task,
    organization: getOrganizationLogData(organization),
  })

  const searchTerm = `${task.name}\n${task.description}`

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })

  const embeddings = await embedder.embedQuery(searchTerm)

  const pineconeSearchFilters: Record<string, any> = {
    organization_id: {
      $eq: task.organization_id,
    },
    type: {
      $eq: 'pull_request_change',
    },
  }

  const vectorDB = getOrganizationVectorDB(organization.id)

  const { matches } = await vectorDB.query({
    vector: embeddings,
    topK: 50,
    includeMetadata: true,
    filter: pineconeSearchFilters,
  })

  if (matches.length === 0) {
    logger.debug('No similar pull requests found', {
      event: 'send_similar_pull_requests:none',
      task,
      organization: getOrganizationLogData(organization),
    })

    // No similar pull requests
    return
  }

  const cohere = new CohereClient({
    token: process.env.COHERE_API_KEY,
  })

  const reranked = await cohere.rerank({
    query: searchTerm,
    documents: matches.map((match) => (match.metadata?.text ?? '') as string),
  })

  const rankedDocuments = reranked.results
    .filter(
      (result) => result.relevanceScore > similarPullRequestScoreThreshold,
    )
    .map(
      (result) =>
        matches[result.index].metadata as unknown as PullRequestChangeMetadata,
    )

  // No ranked results above minimum relevant score
  if (rankedDocuments.length === 0) {
    logger.debug('No pull requests above score threshold', {
      event: 'send_similar_pull_requests:none_above_threshold',
      task,
      organization: getOrganizationLogData(organization),
    })
    return
  }

  const pullRequestSummaries: Record<number, string> = {}

  // Changes could contain duplicate pull requests, so we'll de-dupe
  // them here.
  for (const metadata of rankedDocuments) {
    pullRequestSummaries[metadata.pull_request_id] =
      metadata.pull_request_summary
  }

  const pullRequests: Array<{
    id: number
    title: string
    html_url: string
    summary: string
  }> = []

  for (const [id, summary] of Object.entries(pullRequestSummaries)) {
    const record = await dbClient
      .selectFrom('homie.pull_request')
      .where('organization_id', '=', organization.id)
      .where('homie.pull_request.id', '=', parseInt(id))
      .select(['id', 'title', 'html_url', 'body'])
      .executeTakeFirst()

    // ignore missing prs (may have been deleted since being embedded)
    if (!record) {
      continue
    }

    if (pullRequests.length >= maxNumPullRequestsToSend) {
      continue
    }

    const isReferenceResult = await checkIsReferencePullRequest({
      task: {
        name: task.name,
        description: task.description,
      },
      pullRequest: {
        title: record.title,
        body: record.body,
        summary: summary,
      },
    })

    if (isReferenceResult.failed) {
      logger.debug('failed to check if similar', {
        event: 'send_similar_pull_requests:fail_reference_check',
        ai_call: true,
        task,
        organization: getOrganizationLogData(organization),
        pull_request: {
          id,
          title: record.title,
          body: record.body,
          summary: summary,
        },
        prompt: isReferenceResult.prompt,
        error: isReferenceResult.error,
      })
      continue
    }

    logger.debug('Check is reference', {
      event: 'send_similar_pull_requests:is_reference',
      task,
      ai_call: true,
      organization: getOrganizationLogData(organization),
      pull_request: {
        id,
        title: record.title,
        body: record.body,
        summary: summary,
      },
      prompt: isReferenceResult.prompt,
      is_reference: isReferenceResult.isReference,
    })

    if (!isReferenceResult.isReference) {
      continue
    }

    pullRequests.push({
      id: record.id,
      title: record.title,
      html_url: record.html_url,
      summary,
    })
  }

  if (pullRequests.length === 0) {
    logger.debug('No similar pull requests.', {
      event: 'send_similar_pull_requests:none_similar',
      task,
      organization: getOrganizationLogData(organization),
      pullRequests,
    })

    return
  }

  logger.debug('Found similar pull requests', {
    event: 'send_similar_pull_requests:found_matches',
    task,
    organization: getOrganizationLogData(organization),
    pullRequests,
  })

  // Github Issue
  if (
    task.ext_gh_issue_number &&
    task.github_repo_id &&
    organization.ext_gh_install_id
  ) {
    await postSimilarPullRequestsGithubIssueComment({
      targetTask: {
        ext_gh_issue_number: task.ext_gh_issue_number,
        github_repo_id: task.github_repo_id,
      },
      organization: {
        id: organization.id,
        ext_gh_install_id: organization.ext_gh_install_id,
      },
      pullRequests,
    })
  }

  if (task.ext_asana_task_id && organization.asana_access_token) {
    await postSimilarPullRequestsAsanaTaskComment({
      targetTask: {
        ext_asana_task_id: task.ext_asana_task_id,
      },
      organization: {
        id: organization.id,
        asana_access_token: organization.asana_access_token,
      },
      pullRequests,
    })
  }

  if (organization.trello_access_token && task.ext_trello_card_id) {
    await postSimilarPullRequestsTrelloTaskComment({
      targetTask: {
        ext_trello_card_id: task.ext_trello_card_id,
      },
      organization: {
        id: organization.id,
        trello_access_token: organization.trello_access_token,
      },
      pullRequests,
    })
  }

  await dbClient
    .updateTable('homie.task')
    .set({
      has_received_similar_pull_requests: true,
    })
    .where('id', '=', task.id)
    .executeTakeFirstOrThrow()
}
