import { dbClient } from '@/database/client'
import { checkIfTasksAreIdentical } from '@/lib/ai/check-if-tasks-are-identical'
import { TaskMetadata } from '@/lib/ai/embed-task'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { postPotentialDuplicateGithubIssueComment } from '@/lib/github/post-potential-duplicate-github-issue-comment'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { taskStatus } from '@/lib/tasks'
import { CheckForDuplicateTask } from '@/queue/jobs'
import { CohereClient } from 'cohere-ai'

/**
 * Cohere relevance score. If a task relevance score is above this, then it is
 * considered to potentially be a duplicate.
 */
const duplicateTaskRelevanceScoreThreshold = 0.5

export async function handleCheckForDuplicateTask(job: CheckForDuplicateTask) {
  const { task, organization } = job.data

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
    return
  }

  const duplicateTaskId = rankedDocuments[0].task_id

  const duplicateTask = await dbClient
    .selectFrom('homie.task')
    .where('organization_id', '=', task.organization_id)
    .where('homie.task.id', '=', duplicateTaskId)
    .where('task_status_id', '=', taskStatus.open)
    .select(['name', 'description', 'html_url'])
    .executeTakeFirst()

  if (!duplicateTask) {
    return
  }

  const isDuplicate = checkIfTasksAreIdentical({
    taskA: task,
    taskB: duplicateTask,
  })

  if (!isDuplicate) {
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

  // send asana comment
  // send trello comment

  // TODO:
  // - Found duplicate task, send comments....
  // - add logging
}
