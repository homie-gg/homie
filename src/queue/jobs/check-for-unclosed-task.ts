import { dbClient } from '@/database/client'
import { checkPullRequestIsForTask } from '@/lib/ai/check-pull-request-is-for-task'
import { TaskMetadata } from '@/lib/ai/embed-task'
import { getOrganizationVectorDB } from '@/lib/ai/get-organization-vector-db'
import { postUnclosedAsanaTaskComment } from '@/lib/asana/post-unclosed-asana-task-comment'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { postUnclosedGithubIssueComment } from '@/lib/github/post-unclosed-github-issue-comment'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { postUnclosedTrelloTaskComment } from '@/lib/trello/post-unclosed-trello-task-comment'
import { CohereClient } from 'cohere-ai'
import { createJob } from '@/queue/create-job'

/**
 * Cohere relevance score. If a task relevance score is above this, then it is
 * potentially a task that is for the PR
 */
const matchingTaskRelevantScoreThreshold = 0.5

export const checkForUnclosedTask = createJob({
  id: 'check_for_unclosed_task',
  handle: async (payload: {
    pull_request: {
      id: number
      merged_at: string | null
      body: string | null
      title: string
      number: number
      created_at: string
      html_url: string
      organization_id: number
    }
    summary: string
  }) => {
    const { pull_request, summary } = payload

    logger.debug('Check for unclosed tasks', {
      event: 'check_for_unclosed_tasks:start',
      pull_request: getPullRequestLogData(pull_request),
      organization: getOrganizationLogData({
        id: pull_request.organization_id,
      }),
    })

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
      .where('homie.organization.id', '=', pull_request.organization_id)
      .select([
        'homie.organization.id',
        'ext_gh_install_id',
        'asana.app_user.asana_access_token',
        'trello.workspace.trello_access_token',
      ])
      .executeTakeFirstOrThrow()

    const query = `${pull_request.title}\n${pull_request.body}\n${summary}`

    const embedder = createOpenAIEmbedder({
      modelName: 'text-embedding-3-large',
    })

    const embeddings = await embedder.embedQuery(query)

    const vectorDB = getOrganizationVectorDB(pull_request.organization_id)

    const { matches } = await vectorDB.query({
      vector: embeddings,
      topK: 50,
      includeMetadata: true,
      filter: {
        organization_id: {
          $eq: pull_request.organization_id,
        },
        type: {
          $eq: 'task',
        },
        task_status: {
          $eq: 'open',
        },
      },
    })

    if (matches.length === 0) {
      logger.debug('No matching tasks', {
        event: 'check_for_unclosed_tasks:no_matches',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      })

      // No matching unclosed tasks
      return
    }

    const cohere = new CohereClient({
      token: process.env.COHERE_API_KEY,
    })

    const reranked = await cohere.rerank({
      query: query,
      documents: matches.map((match) => (match.metadata?.text ?? '') as string),
    })

    const rankedDocuments = reranked.results
      .filter(
        (result) => result.relevanceScore > matchingTaskRelevantScoreThreshold,
      )
      .map(
        (result) => matches[result.index].metadata as unknown as TaskMetadata,
      )

    // No ranked results above minimum relevant score
    if (rankedDocuments.length === 0) {
      logger.debug('No potential matching tasks above threshold', {
        event: 'check_for_duplicate_task:no_potential_target_tasks',
        organization: getOrganizationLogData({
          id: pull_request.organization_id,
        }),
        matches: matches.map((match) => match.metadata),
      })
      return
    }

    const tasks: Array<{
      id: number
      description: string
      html_url: string
      name: string
      ext_gh_issue_number: number | null
      github_repo_id: number | null
      ext_asana_task_id: string | null
      ext_trello_card_id: string | null
    }> = []

    for (const document of rankedDocuments) {
      const task = await dbClient
        .selectFrom('homie.task')
        .where('organization_id', '=', pull_request.organization_id)
        .where('homie.task.id', '=', document.task_id)
        .select([
          'name',
          'description',
          'html_url',
          'id',
          'ext_gh_issue_number',
          'github_repo_id',
          'ext_asana_task_id',
          'ext_trello_card_id',
        ])
        .executeTakeFirst()

      if (task) {
        tasks.push(task)
      }
    }

    await Promise.all(
      tasks.map(async (task) => {
        const matchResult = await checkPullRequestIsForTask({
          task: {
            name: task.name,
            description: task.description,
          },
          pullRequest: {
            title: pull_request.title,
            body: pull_request.body,
            summary: summary,
          },
        })

        if (matchResult.failed) {
          logger.debug('Failed to check if PR matches task', {
            event: 'check_for_unclosed_tasks:pr_match_failed',
            ai_call: true,
            task,
            pull_request,
            prompt: matchResult.prompt,
            error: matchResult.error,
            organization: getOrganizationLogData({
              id: pull_request.organization_id,
            }),
          })

          return
        }

        logger.debug('Got PR match result for task', {
          ai_call: true,
          event: 'check_for_unclosed_tasks:check_pr_matches_task',
          task,
          pull_request,
          organization: getOrganizationLogData({
            id: pull_request.organization_id,
          }),
          is_match: matchResult.isMatch,
          prompt: matchResult.prompt,
        })

        if (!matchResult.isMatch) {
          return
        }

        // Github Issue
        if (
          task.ext_gh_issue_number &&
          task.github_repo_id &&
          organization.ext_gh_install_id
        ) {
          await postUnclosedGithubIssueComment({
            task: {
              ext_gh_issue_number: task.ext_gh_issue_number,
              github_repo_id: task.github_repo_id,
            },
            organization: {
              id: organization.id,
              ext_gh_install_id: organization.ext_gh_install_id,
            },
            pullRequest: {
              title: pull_request.title,
              html_url: pull_request.html_url,
            },
          })
        }

        if (task.ext_asana_task_id && organization.asana_access_token) {
          await postUnclosedAsanaTaskComment({
            task: {
              ext_asana_task_id: task.ext_asana_task_id,
            },
            organization: {
              id: organization.id,
              asana_access_token: organization.asana_access_token,
            },
            pullRequest: {
              title: pull_request.title,
              html_url: pull_request.html_url,
            },
          })
        }

        if (organization.trello_access_token && task.ext_trello_card_id) {
          await postUnclosedTrelloTaskComment({
            task: {
              ext_trello_card_id: task.ext_trello_card_id,
            },
            organization: {
              id: organization.id,
              trello_access_token: organization.trello_access_token,
            },
            pullRequest: {
              title: pull_request.title,
              html_url: pull_request.html_url,
            },
          })
        }
      }),
    )
  },
})
