import { dbClient } from '@/database/client'
import { checkIsDuplicateTask } from '@/lib/ai/check-is-duplicate-task'
import { TaskMetadata } from '@/lib/ai/embed-task'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { postPotentialDuplicateAsanaTaskComment } from '@/lib/asana/post-potential-duplicate-asana-task-comment'
import { postPotentialDuplicateGithubIssueComment } from '@/lib/github/post-potential-duplicate-github-issue-comment'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { postPotentialDuplicateTrelloTaskComment } from '@/lib/trello/post-potential-duplicate-trello-comment'
import { CheckForDuplicateTask } from '@/queue/jobs'
import { CohereClient } from 'cohere-ai'

/**
 * Cohere relevance score. If a task relevance score is above this, then it is
 * considered to potentially be a duplicate.
 */
const duplicateTaskRelevanceScoreThreshold = 0.5

export async function handleCheckForDuplicateTask(job: CheckForDuplicateTask) {
  const { task } = job.data

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

  logger.debug('Check for duplicate task', {
    event: 'check_for_duplicate_task:start',
    data: {
      task,
      organization: getOrganizationLogData(organization),
    },
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
      $eq: 'task',
    },
    task_id: {
      $ne: task.id, // Don't match THIS task (or it will be a duplicate)
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
    logger.debug('No matching tasks found', {
      event: 'check_for_duplicate_task:no_match',
      data: {
        task,
        organization: getOrganizationLogData(organization),
      },
    })

    // No matching duplicate task
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
      (result) => result.relevanceScore > duplicateTaskRelevanceScoreThreshold,
    )
    .map((result) => matches[result.index].metadata as unknown as TaskMetadata)

  // No ranked results above minimum relevant score
  if (rankedDocuments.length === 0) {
    logger.debug('No potential duplicates above threshold', {
      event: 'check_for_duplicate_task:no_potential_duplicates',
      data: {
        task,
        organization: getOrganizationLogData(organization),
        matches: matches.map((match) => match.metadata),
      },
    })
    return
  }

  const duplicateTaskId = rankedDocuments[0].task_id

  const duplicateTask = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', task.organization_id)
    .where('homie.task.id', '=', duplicateTaskId)
    .select(['name', 'description', 'html_url', 'id'])
    .executeTakeFirst()

  if (!duplicateTask) {
    logger.debug('Missing duplicate task', {
      event: 'check_for_duplicate_task:missing_duplicate_task',
      data: {
        task,
        organization: getOrganizationLogData(organization),
        matches: matches.map((match) => match.metadata),
        duplicate_task_id: duplicateTaskId,
      },
    })
    return
  }

  const isDuplicate = checkIsDuplicateTask({
    taskA: task,
    taskB: duplicateTask,
    logData: {
      organization: getOrganizationLogData(organization),
    },
  })

  if (!isDuplicate) {
    logger.debug('Check: Not duplicate', {
      event: 'check_for_duplicate_task:not_duplicate',
      data: {
        task,
        organization: getOrganizationLogData(organization),
        matches: matches.map((match) => match.metadata),
        is_duplicate: false,
        duplicate_task: duplicateTask,
      },
    })
    return
  }

  logger.debug('Found duplicate', {
    event: 'check_for_duplicate_task:found_duplicate',
    data: {
      task,
      organization: getOrganizationLogData(organization),
      matches: matches.map((match) => match.metadata),
      duplicate_task: duplicateTask,
      is_duplicate: true,
    },
  })

  const alreadyNotified = await dbClient
    .selectFrom('homie.duplicate_task_notification')
    .where('target_task_id', '=', task.id)
    .where('duplicate_task_id', '=', duplicateTask.id)
    .executeTakeFirst()

  if (alreadyNotified) {
    return
  }

  // Github Issue
  if (
    task.ext_gh_issue_number &&
    task.github_repo_id &&
    organization.ext_gh_install_id
  ) {
    await postPotentialDuplicateGithubIssueComment({
      targetTask: {
        ext_gh_issue_number: task.ext_gh_issue_number,
        github_repo_id: task.github_repo_id,
      },
      organization: {
        id: organization.id,
        ext_gh_install_id: organization.ext_gh_install_id,
      },
      duplicateTask,
    })
  }

  if (task.ext_asana_task_id && organization.asana_access_token) {
    await postPotentialDuplicateAsanaTaskComment({
      targetTask: {
        ext_asana_task_id: task.ext_asana_task_id,
      },
      organization: {
        id: organization.id,
        asana_access_token: organization.asana_access_token,
      },
      duplicateTask,
    })
  }

  if (organization.trello_access_token && task.ext_trello_card_id) {
    await postPotentialDuplicateTrelloTaskComment({
      targetTask: {
        ext_trello_card_id: task.ext_trello_card_id,
      },
      organization: {
        id: organization.id,
        trello_access_token: organization.trello_access_token,
      },
      duplicateTask,
    })
  }

  await dbClient
    .insertInto('homie.duplicate_task_notification')
    .values({
      target_task_id: task.id,
      duplicate_task_id: duplicateTask.id,
    })
    .executeTakeFirstOrThrow()
}
