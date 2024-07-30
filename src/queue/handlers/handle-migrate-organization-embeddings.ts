import { dbClient } from '@/database/client'
import { logger } from '@/lib/log/logger'
import { createOpenAIEmbedder } from '@/lib/open-ai/create-open-ai-embedder'
import { getPineconeClient } from '@/lib/pinecone/pinecone-client'
import { MigrateOrganizationEmbeddings } from '@/queue/jobs'

// Map to avoid re-fetching prs
const homiePullRequests: Record<
  number,
  {
    id: number
    contributor_id: number
    organization_id: number
    title: string
    html_url: string
    body: string
    merged_at: Date | null
  }
> = {}

const githubPullRequests: Record<
  number,
  {
    id: number
    contributor_id: number
    organization_id: number
    title: string
    html_url: string
    body: string
    merged_at: Date | null
  }
> = {}

const gitlabMergeRequests: Record<
  number,
  {
    id: number
    contributor_id: number
    organization_id: number
    title: string
    html_url: string
    body: string
    merged_at: Date | null
  }
> = {}

export async function handleMigrateOrganizationEmbeddings(
  job: MigrateOrganizationEmbeddings,
) {
  const { organization } = job.data
  const index = getPineconeClient().Index(process.env.PINECONE_INDEX_MAIN!)

  const embedder = createOpenAIEmbedder({
    modelName: 'text-embedding-3-large',
  })

  const namespace = `organization_${organization.id}`
  const namespaceIndex = index.namespace(namespace)

  logger.debug(`Migration organization ${organization.id} embeddings`, {
    event: 'migrate_org_embeddings:start',
    organization_id: organization.id,
  })

  // Pull Request Diffs - straight copy

  const pullRequestDiffs = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $eq: 'pull_request_diff',
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got pull_request_diff(s)', {
    event: 'migrate_org_embeddings:got_pr_diff',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
  })

  for (const pullRequestDiff of pullRequestDiffs.matches) {
    namespaceIndex.upsert([
      {
        id: pullRequestDiff.id,
        values: pullRequestDiff.values,
        metadata: pullRequestDiff.metadata,
      },
    ])
  }

  logger.debug('Finished migrating PR diffs', {
    event: 'migrate_org_embeddings:finish_pr_diffs',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
  })

  // PR change - straight copy

  const pullRequestChanges = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $eq: 'pull_request_change',
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got pr changes', {
    event: 'migrate_org_embeddings:got_pr_changes',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
  })

  for (const pullRequestChange of pullRequestChanges.matches) {
    namespaceIndex.upsert([
      {
        id: pullRequestChange.id,
        values: pullRequestChange.values,
        metadata: pullRequestChange.metadata,
      },
    ])
  }

  logger.debug('Finished PR changes', {
    event: 'migrate_org_embeddings:finished_pr_changes',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
  })

  // Conversation - straight copy

  const conversations = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $eq: 'conversation',
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got conversations', {
    event: 'migrate_org_embeddings:got_conversations',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
  })

  for (const conversation of conversations.matches) {
    namespaceIndex.upsert([
      {
        id: conversation.id,
        values: conversation.values,
        metadata: conversation.metadata,
      },
    ])
  }

  logger.debug('Finished conversations', {
    event: 'migrate_org_embeddings:finished_conversations',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
  })

  // PR Summary

  const prSummaries = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $eq: 'pr_summary',
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got PR summaries', {
    event: 'migrate_org_embeddings:got_pr_summaries',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
  })

  for (const prSummary of prSummaries.matches) {
    const githubPrId = prSummary.metadata?.ext_gh_pull_request_id
    if (!githubPrId) {
      continue
    }

    const existingText = prSummary.metadata?.text
    if (!existingText || typeof existingText !== 'string') {
      continue
    }

    const changeMatches = existingText.match(/Changed:((.|\n)*)(Merged at)/)
    if (!changeMatches || changeMatches.length !== 4) {
      continue
    }

    const change = changeMatches[1].trim()
    if (!change) {
      continue
    }

    const pr = await findGithubPR(organization.id, githubPrId)
    if (!pr) {
      continue
    }

    const newChangeText = `${pr.title}\n${change}`
    const newChangeEmbedding = await embedder.embedQuery(newChangeText)

    namespaceIndex.upsert([
      {
        id: prSummary.id,
        values: newChangeEmbedding,
        metadata: {
          type: 'pull_request_change',
          text: newChangeText,
          pull_request_id: pr.id,
          pull_request_title: pr.title,
          pull_request_description: pr.body,
          pull_request_url: pr.html_url,
          organization_id: pr.organization_id,
          contributor_id: pr.contributor_id,
          merged_at: pr.merged_at?.toISOString() ?? '',
          was_merged_to_default_branch: true,
        },
      },
    ])
  }

  logger.debug('Finished PR summaries', {
    event: 'migrate_org_embeddings:finished_pr_summaries',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
  })

  const mrSummaries = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $eq: 'mr_summary',
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got MR summaries', {
    event: 'migrate_org_embeddings:got_mr_summaries',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
    num_mr_summaries: mrSummaries.matches.length,
  })

  for (const mrSummary of mrSummaries.matches) {
    const gitlabMrId = mrSummary.metadata?.ext_gitlab_merge_request_id
    if (!gitlabMrId) {
      continue
    }

    const existingText = mrSummary.metadata?.text
    if (!existingText || typeof existingText !== 'string') {
      continue
    }

    const changeMatches = existingText.match(/Changed:((.|\n)*)(Merged at)/)
    if (!changeMatches || changeMatches.length !== 4) {
      continue
    }

    const change = changeMatches[1].trim()
    if (!change) {
      continue
    }

    const pr = await findGitlabMergeRequest(organization.id, gitlabMrId)
    if (!pr) {
      continue
    }

    const newChangeText = `${pr.title}\n${change}`
    const newChangeEmbedding = await embedder.embedQuery(newChangeText)

    namespaceIndex.upsert([
      {
        id: mrSummary.id,
        values: newChangeEmbedding,
        metadata: {
          type: 'pull_request_change',
          text: newChangeText,
          pull_request_id: pr.id,
          pull_request_title: pr.title,
          pull_request_description: pr.body,
          pull_request_url: pr.html_url,
          organization_id: pr.organization_id,
          contributor_id: pr.contributor_id,
          merged_at: pr.merged_at?.toISOString() ?? '',
          was_merged_to_default_branch: true,
        },
      },
    ])
  }

  logger.debug('Finished MR summaries', {
    event: 'migrate_org_embeddings:finished_mr_summaries',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
    num_mr_summaries: mrSummaries.matches.length,
  })

  // Diffs
  const diffs = await index.query({
    vector: randomSearchVector,
    topK: 10000,
    includeMetadata: true,
    filter: {
      type: {
        $in: ['pr_diff', 'mr_diff'],
      },
      organization_id: {
        $eq: organization.id,
      },
    },
  })

  logger.debug('Got Diffs', {
    event: 'migrate_org_embeddings:got_diffs',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
    num_mr_summaries: mrSummaries.matches.length,
    num_diffs: diffs.matches.length,
  })

  for (const diff of diffs.matches) {
    const prId = diff.metadata?.pull_request_id
    if (!prId) {
      continue
    }

    const existingText = diff.metadata?.text
    if (!existingText || typeof existingText !== 'string') {
      continue
    }

    const changeMatches = existingText.match(/Changed:((.|\n)*)(Merged at)/)
    if (!changeMatches || changeMatches.length !== 4) {
      continue
    }

    const snippet = changeMatches[1].trim()
    if (!snippet) {
      continue
    }

    const pr = await findHomiePr(organization.id, prId)
    if (!pr) {
      continue
    }

    const newSnippetText = `${pr.title}\n${snippet}`
    const newSnippetEmbedding = await embedder.embedQuery(newSnippetText)

    namespaceIndex.upsert([
      {
        id: diff.id,
        values: newSnippetEmbedding,
        metadata: {
          type: 'pull_request_diff',
          text: newSnippetText,
          code_snippet: snippet,
          pull_request_title: pr.title,
          pull_request_description: pr.body,
          pull_request_url: pr.html_url,
          contributor_id: pr.contributor_id,
          organization_id: pr.organization_id,
          merged_at: pr.merged_at?.toISOString() ?? '',
        },
      },
    ])
  }

  logger.debug('Finished Diffs', {
    event: 'migrate_org_embeddings:got_diffs',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
    num_pr_summaries: prSummaries.matches.length,
    num_mr_summaries: mrSummaries.matches.length,
    num_diffs: diffs.matches.length,
  })
}

async function findHomiePr(organizationId: number, id: any) {
  const existing = homiePullRequests[id]
  if (existing) {
    return existing
  }

  const pr = await dbClient
    .selectFrom('homie.pull_request')
    .where('organization_id', '=', organizationId)
    .where('id', '=', id)
    .select([
      'id',
      'contributor_id',
      'organization_id',
      'title',
      'html_url',
      'body',
      'merged_at',
    ])
    .executeTakeFirst()
  if (!pr) {
    return null
  }

  homiePullRequests[id] = pr
  return pr
}

async function findGithubPR(organizationId: number, extGhPullRequestId: any) {
  const existing = githubPullRequests[extGhPullRequestId]
  if (existing) {
    return existing
  }

  const pr = await dbClient
    .selectFrom('homie.pull_request')
    .where('organization_id', '=', organizationId)
    .where('ext_gh_pull_request_id', '=', extGhPullRequestId)
    .select([
      'id',
      'contributor_id',
      'organization_id',
      'title',
      'html_url',
      'body',
      'merged_at',
    ])
    .executeTakeFirst()
  if (!pr) {
    return null
  }

  githubPullRequests[extGhPullRequestId] = pr
  return pr
}

async function findGitlabMergeRequest(
  organizationId: number,
  extGitlabMrId: any,
) {
  const existing = gitlabMergeRequests[extGitlabMrId]
  if (existing) {
    return existing
  }

  const pr = await dbClient
    .selectFrom('homie.pull_request')
    .where('organization_id', '=', organizationId)
    .where('ext_gitlab_merge_request_id', '=', extGitlabMrId)
    .select([
      'id',
      'contributor_id',
      'organization_id',
      'title',
      'html_url',
      'body',
      'merged_at',
    ])
    .executeTakeFirst()
  if (!pr) {
    return null
  }

  gitlabMergeRequests[extGitlabMrId] = pr
  return pr
}

const randomSearchVector = [
  0.01, 0.36, 0.78, 0.21, 0.25, 0.17, 0.37, 0.35, 0.44, 0.84, 0.98, 0.75, 0.58,
  0.28, 0.73, 0.84, 0.14, 0.53, 0.8, 0.22, 0.67, 0.95, 0.03, 0.99, 0.63, 0.61,
  0.95, 0.39, 0.37, 0.89, 0.06, 0.68, 0.41, 0.98, 0.09, 0.28, 0.1, 0.48, 0.8,
  0.71, 0.51, 0.79, 0.98, 0.9, 0.4, 0.16, 0.69, 0.93, 0.96, 0.18, 0.95, 0.66,
  0.41, 0.26, 0.39, 0.29, 0.5, 0.4, 0.73, 0.39, 0.74, 0.27, 0.81, 0.42, 0.56,
  0.86, 0.51, 0.49, 0.97, 0.34, 0.03, 0.39, 0.12, 0.88, 0.22, 0.39, 0.91, 0.89,
  0.97, 0.1, 0.96, 0.42, 0.55, 0.35, 0.6, 0.15, 0.28, 0.29, 0.02, 0.83, 0.83, 0,
  0.23, 0.92, 0.95, 0.18, 0.03, 0.91, 0.11, 0.48, 0.53, 0.75, 0.2, 0.95, 0.69,
  0.59, 0.21, 0.48, 0.24, 0.02, 0.18, 0.74, 0.53, 0.98, 0.07, 0.71, 0.33, 0.58,
  0.21, 0.21, 0.16, 0.44, 0.7, 0.42, 0.11, 0.85, 0.79, 0.27, 0.72, 0.29, 0.93,
  0.86, 0.58, 0.56, 0.46, 0.2, 0.87, 0.49, 0.17, 0.85, 0.65, 0.06, 0.86, 0.07,
  0.6, 0.17, 0.64, 0.47, 0.44, 0.98, 0.18, 0.11, 0.58, 0.53, 0.41, 0.97, 0.57,
  0.9, 0.15, 0.31, 0.46, 0.6, 0.94, 0.83, 0.8, 0.12, 0, 0.47, 0.06, 0.64, 0.97,
  0.69, 0.22, 0.06, 0.19, 0.12, 0.04, 0.68, 0.13, 0.47, 0.06, 0.38, 0.84, 0.92,
  0.21, 0.69, 0.48, 0.04, 0.08, 0.11, 0.58, 0.72, 0.16, 0.3, 0.16, 0.82, 0.09,
  0.52, 0.49, 0.34, 0.43, 0.66, 0.34, 0.66, 0.41, 0.81, 0.59, 0.63, 0.7, 0.98,
  0.97, 0.02, 0.64, 0.28, 0.63, 0.26, 0.37, 0.04, 0.59, 0.99, 0.38, 0.83, 0.01,
  0.44, 0.76, 0.13, 0.01, 0.78, 0.02, 0.39, 0.03, 0.84, 0.23, 0.54, 0.82, 0.54,
  0.39, 0.56, 0.63, 0.2, 0.3, 0.55, 0.92, 0.23, 0.87, 0.63, 0.8, 0.24, 0.07,
  0.24, 0.25, 0.42, 0.41, 0.97, 0.22, 0.91, 0.27, 0.71, 0.05, 0.82, 0.81, 0.61,
  0.38, 0.24, 0.72, 0.43, 0, 0.28, 0.51, 0.08, 0.45, 0.58, 0.98, 0.23, 0.88,
  0.06, 0.54, 0.55, 0.16, 0.71, 0.91, 0.22, 0.76, 0.2, 0.87, 0.15, 0.94, 0.19,
  0.84, 0.73, 0.11, 0.14, 0.74, 0.75, 0.56, 0.02, 0.48, 0.24, 0.51, 0.12, 0.39,
  0.98, 0.94, 0.07, 0.22, 0.33, 0.32, 0.85, 0.85, 0.78, 0.28, 0.31, 0.47, 0.94,
  0.27, 0.08, 0.84, 0.84, 0.34, 0.91, 0.41, 0.09, 0.84, 0.73, 0.75, 0.82, 0.14,
  0.23, 0.48, 0.61, 0.01, 0.46, 0.76, 0.62, 0.56, 0.52, 0.94, 0.38, 0.09, 0.81,
  0.58, 0.33, 0.49, 0.56, 0.3, 0.57, 0.28, 0.72, 0.59, 0.14, 0.32, 0.84, 0.89,
  0.6, 0.8, 0.06, 0.83, 0.05, 0.93, 0.97, 0.27, 0.65, 0.55, 0.86, 0.07, 0.22,
  0.85, 0.51, 0.24, 0.43, 0.47, 0.39, 0.01, 0.09, 0.01, 0.93, 0.37, 0.4, 0.83,
  0.59, 0.18, 0.18, 0.86, 0.82, 0.54, 0.39, 0.71, 0.89, 0.58, 0.61, 0.83, 0.53,
  0.03, 0.25, 0.77, 0.35, 0.86, 0.09, 0.19, 0.89, 0.13, 0.98, 0.48, 0.44, 0.63,
  0.94, 0.1, 0.18, 0.37, 0.11, 0.18, 0.58, 0.04, 0.73, 0.26, 0.39, 0.41, 0.36,
  0.08, 0.47, 0.73, 0.86, 0.24, 0.02, 0.08, 0.04, 0.38, 0.24, 0.67, 0.43, 0.16,
  0.97, 0.16, 0.06, 0.5, 0.5, 0.86, 0.96, 0.79, 0.01, 0.85, 0.01, 0.9, 0.2,
  0.01, 0.06, 0.87, 0.68, 0.57, 0.24, 0.48, 0.08, 0.11, 0.74, 0.74, 0.91, 0.45,
  0.07, 0.68, 0.73, 0.18, 0.62, 0.68, 0.21, 0.09, 0.81, 0.84, 0.13, 0.37, 0.21,
  0.95, 0.53, 0.94, 0.07, 0.57, 0.43, 0.31, 0.97, 0.17, 0.57, 0.75, 0.38, 0.25,
  0.07, 0.32, 0.49, 0.55, 0.71, 0.46, 0.23, 0.24, 0.4, 0.35, 0.85, 0.81, 0.87,
  0.05, 0.95, 0.58, 0.44, 0.29, 0.06, 0.15, 0.57, 0.81, 0.88, 0.8, 0.98, 0.14,
  0.23, 0.49, 0.73, 0.51, 0.09, 0.55, 0.95, 0.73, 0.64, 0.33, 0.27, 0.86, 0.58,
  0.99, 0.09, 0.55, 0.52, 0.91, 0.46, 0.49, 0.98, 0.21, 0.9, 0.23, 0.31, 0.38,
  0.31, 0.18, 0.05, 0.14, 0.99, 0.58, 0.4, 0.13, 0.39, 0.66, 0.7, 0.93, 0.83,
  0.44, 0.49, 0.23, 0.4, 0.03, 0.16, 0.5, 0.32, 0.52, 0.9, 0.39, 0.11, 0.81,
  0.27, 0.97, 0.05, 0.37, 0.06, 0.74, 0.01, 0.65, 0.24, 0.76, 0.57, 0.5, 0.69,
  0.68, 0.7, 0.47, 0.19, 0.39, 0.49, 0.07, 0.47, 0.66, 0.45, 0.48, 0.21, 0.8,
  0.02, 0.38, 0.29, 0.61, 0.47, 0.31, 0.08, 0.16, 0.62, 0.47, 0.3, 0.98, 0.98,
  0.2, 0.65, 0.92, 0.18, 0.22, 0.75, 0.93, 0.48, 0.58, 0.44, 0.82, 0.42, 0.11,
  0.89, 0.82, 0.55, 0.35, 0.05, 0.99, 0.32, 0.54, 0.37, 0.81, 0.81, 0.5, 0.99,
  0.81, 0.31, 0.46, 0.39, 0.04, 0.25, 0.93, 0.14, 0.05, 0.1, 0.14, 0.75, 0.17,
  0.3, 0.05, 0.26, 0.46, 0.2, 0.45, 0.51, 0.13, 0.73, 0.49, 0.5, 0.07, 0.68,
  0.85, 0.44, 0.95, 0.84, 0.43, 0.1, 0.35, 0.08, 0.37, 0.81, 0.14, 0.39, 0.23,
  0.94, 0.5, 0.51, 0.04, 0.86, 0.55, 0.14, 0.22, 0.49, 0.65, 0.04, 0.49, 0.59,
  0.87, 0.21, 0.97, 0.9, 0.39, 0.5, 1, 0.6, 0.99, 0.56, 0.54, 0.67, 0.09, 0.08,
  0.18, 0.39, 0.98, 0.16, 0.25, 0.71, 0.43, 0.25, 0.15, 0.9, 0.7, 0.91, 0.67,
  0.23, 0.96, 0.45, 0.68, 0.66, 0.99, 0.51, 0.03, 0.82, 0.82, 0.45, 0.72, 0.33,
  0.36, 0.4, 0.86, 0.23, 0.01, 0.79, 0.1, 0.84, 0.7, 0.86, 0.46, 0.92, 0.13,
  0.54, 0.58, 0.45, 0.55, 0.08, 0.28, 0.65, 0.52, 0.36, 0.01, 0.27, 0.01, 0.66,
  0.72, 0.32, 0.05, 0.41, 0.95, 0.16, 0.44, 0.59, 0.59, 0.34, 0.03, 0.91, 0.6,
  0.4, 0.96, 0.49, 0.94, 0.13, 0.86, 0.91, 1, 0.43, 0.86, 0.39, 0.42, 0.16,
  0.91, 0.29, 0.03, 0.14, 0.53, 0.59, 0.25, 0.94, 0.57, 0.5, 0.49, 0.69, 0.79,
  0.32, 0.56, 0.4, 0.14, 0.01, 0.74, 0.11, 0.16, 0.39, 0.9, 0.09, 0.14, 0.46,
  0.76, 0.98, 0.09, 0.72, 0.22, 0.31, 0.76, 0.43, 0.53, 0.26, 0.91, 0.75, 0.11,
  0.12, 0.85, 0.92, 0.7, 0.61, 0.24, 0.11, 0.5, 0.63, 0.25, 0.83, 0.52, 0.41,
  0.8, 0.27, 0.86, 0.73, 0.38, 0.85, 0.63, 0.05, 0.57, 0.4, 0.43, 0.75, 0.51,
  0.83, 0.21, 0.05, 0.15, 0.56, 0.2, 0.72, 0.39, 0.44, 0.93, 0.8, 0.56, 0.68,
  0.13, 0.86, 0.19, 0.91, 0.57, 0.42, 0.14, 0.9, 0.56, 0.73, 0.54, 0.13, 0.68,
  0.4, 0.26, 0.5, 0.65, 0.13, 0.52, 0.95, 0.55, 0.04, 0.23, 0.82, 0.31, 0.46,
  0.44, 0.77, 0.09, 0.75, 0.94, 0.14, 0.44, 0.77, 0.25, 0.18, 0.83, 0.55, 0.68,
  0.75, 0.65, 0.47, 0.76, 0.83, 0.28, 0.92, 0.85, 0.87, 0.01, 0.89, 0.02, 0.59,
  0.75, 0.57, 0.65, 0.83, 0.76, 0.59, 0.96, 0.6, 0.45, 0.18, 0.51, 0.03, 0.07,
  0.14, 0.61, 0.86, 0.88, 0.71, 0.32, 0.9, 0.08, 0.39, 0.34, 0.49, 0.63, 0.1,
  0.03, 0.32, 0.38, 0.88, 0.19, 0.11, 0.74, 0.64, 0.74, 0.77, 0.08, 0.7, 0.7,
  0.68, 0.35, 0.02, 0.61, 0.28, 0.57, 0.07, 0.82, 0.86, 0.64, 0.95, 0.65, 0.31,
  0.05, 0.96, 0.04, 0.29, 0.64, 0.89, 0.34, 0.44, 0.83, 0.7, 0.3, 0.6, 0.76,
  0.45, 0.66, 0.62, 0.83, 0.04, 0.21, 0.28, 0.56, 0.28, 0.32, 0.71, 0.06, 0.48,
  0.73, 0.93, 0.49, 0.32, 0.62, 0.99, 0.61, 0.35, 0.06, 0.88, 0.52, 0.85, 0.4,
  0.61, 0.35, 0.17, 0.67, 0.18, 0.51, 0.21, 0.01, 0.55, 0.68, 0.95, 0.36, 0.55,
  0.8, 0.95, 0.65, 0.8, 0.39, 0.52, 0.11, 0.2, 0.07, 0.56, 0.45, 0.03, 0.22,
  0.44, 0.52, 0.5, 0.21, 0.51, 0.68, 0.62, 0.19, 0.28, 0.88, 0.53, 0.74, 0.66,
  0.81, 0.55, 0.73, 0.9, 0.1, 0.44, 0.09, 0.38, 0.52, 0.32, 0.56, 0.32, 0.63,
  0.9, 0.29, 0.78, 0.35, 0.49, 0.95, 0.47, 0.86, 0.38, 0.33, 0.9, 0.01, 0.32,
  0.66, 0.76, 0.1, 0.5, 0.82, 0.97, 0.68, 0.06, 0.21, 0.72, 0.99, 0.62, 0.78,
  0.73, 0.28, 0.66, 0.31, 0.29, 0.79, 0.25, 0.48, 0.2, 0.18, 0.91, 0.85, 0.37,
  0.88, 0.5, 0.81, 0.08, 0.95, 0, 0.2, 0.45, 0.9, 0.47, 0.89, 0.16, 0.08, 0.54,
  0.73, 0.49, 0.25, 0.18, 0.17, 0.99, 0.63, 0.93, 0.3, 0.68, 0.05, 0.95, 0.15,
  0.44, 0.84, 0.78, 0.69, 0.13, 0.64, 0.09, 0.68, 0.53, 0.27, 0.63, 0.71, 0.67,
  0.56, 0.25, 0.25, 0.15, 0.83, 0.31, 0.33, 0.28, 0.86, 0.02, 0.02, 0.68, 0.66,
  0.34, 0.6, 0.11, 0.76, 0.62, 0.63, 0.03, 0.51, 0.47, 0.44, 0.96, 0.35, 0.91,
  0.52, 0.28, 0.15, 0.77, 0.78, 0.66, 0.76, 0.81, 0.67, 0.59, 0.74, 0.34, 0.3,
  0.77, 0.77, 0.77, 0.82, 0.62, 0.62, 0.77, 0.05, 0.74, 0.11, 0.89, 0.18, 0.07,
  0.78, 0.39, 0.27, 0.4, 0.23, 0.3, 0.87, 0.49, 0.28, 0.5, 0.58, 0.5, 0.5, 0.13,
  0.48, 0.82, 0.14, 0.98, 0.61, 0.52, 0.65, 0.59, 0.26, 0.9, 0.47, 0.51, 0.45,
  0.58, 0.94, 0.89, 0.85, 0.43, 0.53, 0.87, 0.78, 0.45, 0.1, 0.5, 0.34, 0.18,
  0.09, 0.82, 0.16, 0.65, 0.05, 0.18, 0.91, 0.99, 0.93, 0.82, 0.25, 0.99, 0.47,
  0.19, 0.43, 0.36, 0.97, 0.55, 0.81, 0.16, 0.86, 0.12, 0.24, 0.42, 0.01, 0.53,
  0.01, 0.97, 0.86, 0.53, 0.77, 0.68, 0.97, 0.97, 0.17, 0.62, 0.55, 0.42, 0.49,
  0.6, 0.85, 0.71, 0.71, 0.25, 0.1, 0.54, 0.96, 0.65, 0.37, 0.98, 0.78, 0.54,
  0.39, 0.8, 0.02, 0.75, 0.36, 0.91, 0.15, 0.23, 0.63, 0.16, 0.41, 0, 0.22,
  0.77, 0.18, 0.93, 0.15, 0.69, 0.2, 0.18, 0.18, 0.83, 0.4, 0.73, 0.25, 0.89,
  0.15, 0.94, 0.54, 0.09, 0.92, 0.56, 0.68, 0.37, 0.97, 0.16, 0.11, 0.55, 0.11,
  0.65, 0.81, 0.4, 0.24, 0.01, 0.65, 0.86, 0.91, 0.42, 0.73, 0.13, 0.65, 0.92,
  0.58, 0.84, 0.36, 0.32, 0.76, 0.94, 0.27, 0.71, 0.76, 0.88, 0.3, 0.04, 0.88,
  0.19, 0.78, 0.57, 0.71, 0.31, 0.32, 0.3, 0.57, 0.54, 0.61, 0.24, 0.9, 0.86,
  0.07, 0.86, 0.07, 0.46, 0.33, 0.76, 0.09, 0.94, 0.95, 0.09, 0.37, 0.59, 0.72,
  0.65, 0.2, 0.01, 0.52, 0.74, 0.6, 0.66, 0.28, 0.04, 0.19, 0.01, 0.24, 0.83,
  0.71, 0.89, 0.47, 0.05, 0.56, 0.63, 0.1, 0.2, 0.61, 0.3, 0.66, 0.56, 0.06,
  0.74, 0.36, 0.36, 0.48, 0.49, 0.13, 0.93, 0.69, 0.1, 0.94, 0.83, 0.25, 0.59,
  0.16, 0.6, 0.18, 0.44, 0.5, 0.82, 0.54, 0.92, 0.89, 0.45, 0.38, 0.22, 0.09,
  0.11, 0.72, 0.04, 0.42, 0.8, 0.27, 0.53, 0.08, 0.11, 0.01, 0.93, 0.61, 0.85,
  0.22, 0.96, 0.68, 0.81, 0.95, 0.13, 0.49, 0.15, 0.01, 0.58, 0.4, 0.57, 0.06,
  0.96, 0.98, 0.89, 0.8, 0.47, 0.24, 0.78, 0.6, 0.12, 0.56, 0.21, 0.93, 1, 0.05,
  0.85, 0.84, 0.66, 0.75, 0.23, 0.08, 0.4, 0.99, 0.45, 0.6, 0.14, 0.15, 0.41,
  0.45, 0.4, 0.52, 0.3, 0.94, 0.73, 0.97, 0.28, 0.93, 0.16, 0.9, 0.76, 0.73,
  0.04, 0.98, 0.2, 0.09, 0.57, 0.76, 0.09, 0.7, 0.21, 0.8, 0.43, 0.96, 0.08,
  0.86, 0.32, 0.46, 0.28, 0.94, 1, 0.22, 0.72, 0.42, 0.62, 0.23, 0.98, 0.18,
  0.37, 0.61, 0.05, 0.71, 0.04, 0.42, 0.33, 0.82, 0.19, 0.3, 0.91, 0.43, 0.3,
  0.09, 0.02, 0.69, 0.78, 0.11, 0.14, 0.62, 0.61, 0.97, 0.8, 0.39, 0.97, 0.4,
  0.61, 0.73, 0.28, 0.4, 0.32, 0.77, 0.74, 0.66, 0.23, 0.15, 0.54, 0.32, 0.91,
  0.7, 0.39, 0.07, 0.27, 0.14, 0.21, 0.52, 0.83, 0.61, 0.66, 0.16, 0.57, 0.8,
  0.05, 0.96, 0.98, 0.72, 0.65, 0.55, 0.19, 0.01, 0.4, 0.26, 0.42, 0.24, 0.17,
  0.89, 0.93, 0.4, 0.67, 0.49, 0.88, 0.5, 0.1, 0.97, 0.34, 0.45, 0.39, 0.79,
  0.67, 0.36, 0.38, 0.48, 0.03, 0.53, 0.01, 0.38, 0.54, 0.58, 0.83, 0.71, 0.19,
  0.35, 0.18, 0.03, 0.6, 0.7, 0.32, 0.04, 0.03, 0.63, 0.86, 0.69, 0.44, 0.13,
  0.6, 0.15, 0.85, 0.79, 0.17, 0.1, 0.14, 0.92, 0.89, 0.68, 0.08, 0.19, 0.93,
  0.23, 0.68, 0.54, 0.57, 0.45, 0.15, 0.9, 0.07, 0.59, 0.17, 0.56, 0.78, 0.88,
  0.51, 0.59, 0.8, 0.29, 0.5, 0.43, 0.92, 0.18, 0.35, 0.53, 0.74, 0.93, 0.93,
  0.25, 0.72, 0.51, 0.52, 0.41, 0.72, 0.22, 0.77, 0.61, 0.82, 0.04, 0.45, 0.82,
  0.28, 0.88, 0.88, 0.88, 0.2, 0.13, 0.86, 0.36, 0.3, 0.86, 0.45, 0.11, 0.81,
  0.56, 0.43, 0.15, 0.63, 0.38, 0.25, 0.74, 0.49, 0.2, 0.95, 0.84, 0.77, 0.14,
  0.93, 0.49, 0.84, 0.75, 0.68, 0.67, 0.61, 0.4, 0.8, 0.04, 0.13, 0.39, 0.96,
  0.51, 0.75, 0.3, 0.09, 0.34, 0.71, 0.89, 0.38, 0.69, 0.75, 0.97, 0.73, 0.18,
  0.35, 0.12, 0.99, 0.9, 0.04, 0.98, 0.22, 0.72, 0.93, 0, 0.7, 0.93, 0.62, 0.52,
  0.8, 0.63, 0.85, 0.46, 0.7, 0.4, 0.21, 0.48, 0.98, 0.79, 0.67, 0.58, 0.52,
  0.76, 0.72, 0.53, 0.05, 0.57, 0.48, 0.85, 0.1, 0.78, 0.64, 0.27, 0.78, 0.54,
  0.35, 0.65, 0.35, 0.8, 0.51, 0.94, 0.91, 0.76, 0.68, 0.79, 0.49, 0.16, 0.7,
  0.23, 0.45, 0.84, 0.82, 0.45, 0.19, 0.83, 0.59, 0.13, 0.94, 0.67, 0.96, 0.15,
  0.7, 0.47, 0.68, 0.04, 0.32, 0.46, 0.34, 0.98, 0.51, 0.54, 0.87, 0.67, 0.23,
  0.43, 0.58, 0.36, 0.65, 0.77, 0.22, 0.55, 0.67, 1, 0.74, 0.08, 0.36, 0.49,
  0.68, 0.95, 0.77, 0.07, 0.66, 0.74, 0.11, 0.62, 0.94, 0.13, 0.66, 0.52, 0.5,
  0.78, 0.91, 0.31, 0.55, 0.28, 0.09, 0.78, 0.38, 0.87, 0.32, 0.34, 0.69, 0.84,
  0.05, 0.23, 0.53, 0.22, 0.1, 0.79, 0.53, 0.98, 0.03, 0.14, 0.25, 0.18, 0.42,
  0.86, 0.57, 0.32, 0.39, 0.35, 0.22, 0.28, 0.57, 0.24, 0.16, 1, 0.14, 0.82,
  0.52, 0.08, 0.4, 0.23, 0.47, 0.97, 0.52, 0.46, 0.67, 0.94, 0.72, 0.32, 0.67,
  0.51, 0.56, 0.57, 0.7, 0.07, 0.4, 0.19, 0.97, 0.03, 0.7, 0.46, 0.02, 0.5,
  0.12, 0.81, 0.66, 0.59, 0.72, 0.33, 0.87, 0.87, 0.36, 0.31, 0.05, 0.39, 0.68,
  0.17, 0.19, 0.79, 0.34, 0.42, 0.86, 0.98, 0.86, 0.3, 0.19, 0.46, 0.34, 0.1,
  0.42, 0.75, 0.06, 0.08, 0.83, 0.69, 0.94, 0.79, 0.03, 0.44, 0.84, 0.9, 0.37,
  0.73, 0.22, 0.4, 0.44, 0.68, 0.11, 0.23, 0.47, 0.24, 0.63, 0.8, 0.53, 0.7,
  0.96, 0.99, 0.8, 0.73, 0.37, 0.22, 0.87, 0.72, 0.02, 0.64, 0.26, 0.06, 0.44,
  0.67, 0.91, 0.79, 0.07, 0.72, 0.49, 0.91, 0.26, 0.9, 0.19, 0.85, 0.38, 0.8,
  0.48, 0.23, 0.49, 0.44, 0.05, 0.18, 0.07, 0.48, 0.23, 0.97, 0.22, 0.38, 0.19,
  0.44, 0.18, 0.4, 0.8, 0.93, 0.17, 0.03, 0.51, 0.69, 0.17, 0.96, 0.94, 0.6,
  0.38, 0.87, 0.03, 0.45, 0.96, 0.35, 0.19, 0.39, 0.13, 0.78, 0.41, 0.68, 0.49,
  0.8, 0.25, 0.94, 0.5, 0.23, 0.91, 0.14, 0.1, 0.83, 0.34, 0.96, 0.43, 1, 0.98,
  0.84, 0.55, 0.58, 0.68, 0.01, 0.12, 0.37, 0.94, 0.66, 0.51, 0.37, 0.3, 0.94,
  0.53, 0.99, 0.63, 0.91, 0.21, 0.72, 0.51, 0.95, 0.15, 0.18, 0.42, 0.26, 0.35,
  0.84, 0.19, 0.45, 0.82, 0.88, 1, 0.57, 0.59, 0.07, 0.17, 0.95, 0.16, 0.94,
  0.03, 0.92, 0.96, 0.43, 0.69, 0.7, 0.19, 0.26, 0.07, 0.13, 0.1, 0.88, 0.61,
  0.61, 0.95, 0.07, 0.55, 0.81, 0.77, 0.52, 0.65, 0.73, 0.76, 0.25, 0.59, 0.18,
  0.99, 0.48, 0.55, 0.56, 0.5, 0.05, 0.26, 0.12, 0.67, 0.36, 0.75, 0.84, 0.11,
  0.76, 0.44, 0.41, 0.76, 0.38, 0.45, 0.76, 0.7, 0.62, 0.71, 0.98, 0.97, 0.25,
  0.37, 0.62, 0.65, 0.23, 0.06, 0.36, 0.91, 0.16, 0.99, 0.42, 0.44, 0.25, 0.78,
  0.39, 0.44, 0.97, 0.17, 0.5, 0.7, 0.42, 0, 0.57, 0.3, 0.85, 0.56, 0.64, 0.98,
  0.53, 0.4, 0.86, 0.41, 0.1, 0.59, 0.7, 0.99, 0.1, 0.89, 0.54, 0.07, 0.84,
  0.57, 0.39, 0.41, 0.62, 0.13, 0.7, 0.01, 0.36, 0.92, 0.7, 0.44, 0.81, 0.74,
  0.35, 0.98, 0.1, 0.97, 0.76, 0.05, 0.4, 0.91, 0.87, 0.17, 0.87, 0.35, 0.06,
  0.55, 0.48, 0.95, 0.02, 0.23, 0.86, 0.63, 0.84, 0.96, 0.15, 0.91, 0.05, 0.31,
  0.17, 0.19, 0.73, 0.39, 0.28, 0.83, 0.84, 0.09, 0.55, 0.1, 0.49, 0.9, 0.15,
  0.36, 0.16, 0.9, 0.99, 0.12, 0.47, 0.54, 0.12, 0.25, 0.8, 0.14, 0.18, 0.88,
  0.67, 0.36, 0.23, 0.22, 0.92, 0.66, 0.91, 0.63, 0.89, 0.78, 0.5, 0.36, 0.88,
  0.75, 0.42, 0.67, 0.43, 0.87, 0.49, 0.28, 0.93, 0.24, 0.8, 0.35, 0.14, 0.34,
  0.57, 0.77, 0.95, 0.92, 0.78, 0.8, 0.11, 0.65, 0.36, 0.74, 0.5, 0.65, 0.49,
  0.65, 0.55, 0.99, 0.59, 0.82, 0.31, 0.73, 0.86, 0.39, 0.2, 0.37, 0.92, 0.47,
  0.83, 0.67, 0.54, 0.91, 0.48, 0.78, 0.16, 0.19, 0.12, 0.18, 0.41, 0.28, 0.71,
  0.21, 0.53, 0.61, 0.12, 0, 0.07, 0.7, 0.33, 0.16, 0.21, 0.13, 0.96, 0.7, 0.2,
  0.95, 0.39, 0.03, 0.53, 0.89, 0.71, 0.16, 0.05, 0.46, 0.78, 0.86, 0.13, 0.74,
  0.69, 0.49, 0.51, 0.16, 0.23, 0.99, 0.76, 0.36, 0.5, 0.26, 0.57, 0.27, 0.84,
  0.89, 0.06, 0.24, 0.62, 0.18, 0.39, 0.92, 0.63, 0.29, 0.37, 0.52, 0.4, 0.6,
  0.64, 0.7, 0.72, 0.57, 0.05, 0.57, 0.37, 0.06, 0.56, 0.4, 0.58, 0.35, 0.36,
  0.71, 0.45, 0.99, 0.86, 0.06, 0.83, 0.56, 1, 0.45, 0.91, 0.52, 0.77, 0.85,
  0.68, 0.11, 0.94, 0.7, 0.28, 0.64, 0.29, 0.77, 0.18, 0.81, 0.18, 0.8, 0.37,
  0.97, 0.28, 0.37, 0.63, 0.25, 0.09, 0.28, 0.53, 0.28, 0.92, 0.81, 0.82, 0.99,
  1, 0.5, 0.71, 0.52, 0.51, 0.02, 0.47, 0.94, 0.44, 0.49, 0.32, 0.77, 0.42,
  0.75, 0.49, 0.66, 0.97, 0.42, 0.58, 0.41, 0.26, 0.79, 0.23, 0.39, 0.25, 0.22,
  0.95, 0.87, 0.26, 0.25, 0.84, 0.55, 0.32, 0.05, 0.82, 0.55, 0.91, 0.79, 0.66,
  0.58, 0.54, 0.18, 0.88, 0.38, 0.23, 0.9, 0.13, 0.95, 0.7, 0.28, 0.85, 0.9,
  0.35, 0.38, 0.31, 0.07, 0.75, 0.22, 0.56, 0.71, 0.62, 0.11, 0.43, 0.52, 0.82,
  0.64, 0.74, 0.66, 0.82, 0.15, 0.39, 0.19, 0.56, 0.27, 0.33, 0.52, 0.67, 0.65,
  0.77, 0.9, 0.61, 0.63, 0.48, 0.23, 0.9, 0.47, 0.57, 0.38, 0.58, 0.25, 0.14,
  0.49, 0.16, 0.94, 0.21, 0.43, 0.83, 0.49, 0.6, 0.41, 0.9, 0.24, 0.45, 0.93,
  0.94, 0.71, 0.17, 0.07, 0.27, 0.32, 0.49, 0.86, 0.01, 0.37, 0.78, 0.03, 0.59,
  0.47, 0.86, 0.76, 0.8, 0.46, 0.75, 0.6, 0.74, 0.83, 0.25, 0.39, 0.78, 0.48,
  0.55, 0.08, 0.5, 0.45, 0.64, 0.74, 0.8, 0.17, 0.62, 0.52, 0.44, 0.06, 0.58,
  0.58, 0.69, 0.35, 0.89, 0.46, 0.76, 0.12, 0.24, 0.94, 0.93, 0.88, 0.86, 0.42,
  0.28, 0.85, 0.94, 0.76, 0.49, 0.84, 0.26, 0.46, 0.35, 0.09, 0.66, 0.8, 0.14,
  0.28, 0.41, 0.71, 0.37, 0.16, 0.27, 0.73, 0.62, 0.57, 0.83, 0.34, 0.62, 0.94,
  0.27, 0.09, 0.12, 0.71, 0.73, 0.76, 0.55, 0.91, 0.53, 0.49, 0.03, 0.63, 0.72,
  0.59, 0.85, 0.25, 0.19, 0.89, 0.5, 0.57, 0.61, 0.34, 0.99, 0.03, 0.87, 0.53,
  0.14, 0.56, 0.06, 0.03, 0.81, 0.78, 0.74, 0.39, 0.46, 0.59, 0.09, 0.44, 0.57,
  0.6, 0.25, 0.16, 0.68, 0.41, 0.4, 0.43, 0.21, 0.66, 0.11, 0.02, 0.51, 0.98,
  0.98, 0.59, 0.58, 0.81, 0.23, 0.88, 0.84, 0.62, 0.11, 0.89, 0.05, 0.42, 0.3,
  0.08, 0.86, 0.58, 0.21, 0.07, 0.89, 0.22, 0.42, 0.95, 0.24, 0.74, 0.5, 0.42,
  0.97, 0.06, 0.96, 0.18, 0.56, 0.89, 0.32, 0.76, 0.56, 0.33, 0.65, 0.31, 0.79,
  0.8, 0.6, 0.78, 0.23, 0.11, 0.3, 0.23, 0.94, 0.74, 0.94, 0.77, 0.49, 0.85,
  0.27, 0.03, 0.95, 0.74, 0.94, 0.38, 0.58, 0.28, 0.97, 0.88, 0.96, 0.48, 0.57,
  0.38, 0.54, 0.51, 0.78, 0.68, 0.43, 0.37, 0.67, 0.51, 0.19, 0.49, 0.64, 0.48,
  0.21, 0.29, 0.16, 0.93, 0.23, 0.4, 0.59, 0.48, 0.48, 0.79, 0.31, 0.14, 0.87,
  0.73, 0.45, 0.38, 0.49, 0.55, 0.18, 0.53, 0.79, 0.44, 0.07, 0.95, 0.76, 0.26,
  0.76, 0.42, 0.43, 0.62, 0.5, 0.86, 0.06, 0.13, 0.01, 0, 0.61, 0.25, 0.03, 0.5,
  0.41, 0.29, 0.24, 0.66, 0.52, 0.45, 0.6, 0.03, 0.97, 0.34, 0.49, 0.33, 0.47,
  0.12, 0.28, 0.34, 0.41, 0.26, 0.52, 0.13, 0.21, 0.42, 0.87, 0.12, 0.89, 0.87,
  0.92, 0.35, 0.69, 0.88, 0.35, 0.96, 0.46, 0.5, 0.78, 0.14, 0.14, 0.22, 0.2,
  0.66, 0.59, 0.87, 0.49, 0.35, 0.5, 0.3, 0.26, 0.54, 0.73, 0.47, 0.15, 0.28,
  0.68, 0.29, 0.3, 0.17, 0.87, 0.91, 0.06, 0.97, 0.68, 0.57, 0.51, 0.96, 0.03,
  0.36, 0.49, 0.77, 0.35, 0.41, 0.94, 0.24, 0.52, 0.76, 0.83, 0.21, 0.52, 0.52,
  0.66, 0.9, 0.7, 0.5, 0.55, 0.81, 0.9, 0.7, 0.14, 0.46, 0.36, 0.04, 0.35, 0.8,
  0.79, 0.23, 0.94, 0.16, 0.19, 0.11, 0.34, 0.59, 0.18, 0.74, 0.54, 0.17, 0.93,
  0.56, 0.8, 0.27, 0.49, 0.26, 0.68, 0.52, 0.17, 0.35, 0.79, 0.01, 0.59, 0.67,
  0.99, 0.81, 0.87, 0.2, 0.76, 0.02, 0.25, 0.83, 0.14, 0.85, 0.83, 0.81, 0.01,
  0.32, 0.41, 0.47, 0.44, 0.93, 0.51, 0.68, 0.54, 0.49, 0.04, 0.59, 0.99, 0.68,
  0.86, 0.83, 0.91, 0.29, 0.05, 0.89, 0.16, 0.46, 0.96, 0.42, 0.42, 0.11, 0.7,
  0.25, 0.69, 0.98, 0.57, 0.1, 0.72, 0.39, 0.9, 0.23, 0.97, 0.02, 0.82, 0.5,
  0.7, 0.85, 0.81, 0.36, 0.15, 0.39, 0.53, 0.99, 0.86, 0.74, 0.52, 0.69, 0.89,
  0.65, 1, 0.06, 0.56, 0.13, 0.99, 0.5, 0.99, 0.73, 0.01, 0.05, 1, 0.71, 0.13,
  0.75, 0.9, 0.47, 0.3, 0.25, 0.99, 0.18, 0.94, 0.76, 0.38, 0.79, 0.48, 0.72,
  0.6, 0.32, 0.26, 0.83, 0.2, 0.72, 0.39, 0.27, 0.95, 0.12, 0.81, 0.92, 0.91,
  0.18, 0.46, 0.19, 0.6, 0.6, 0.01, 0.97, 0.91, 0.45, 0.37, 0.05, 0.72, 0.01,
  0.02, 0.44, 0.31, 0.62, 0.63, 0, 0.67, 0.35, 0.01, 0.28, 0.8, 0.61, 0.66,
  0.64, 0.39, 0.91, 0.14, 0.29, 0, 0.82, 0.19, 0.06, 0.44, 0.86, 0.75, 0.77,
  0.48, 0.13, 0.62, 0.8, 0.76, 0.57, 0.53, 0.74, 0.13, 0.11, 0.16, 0.43, 0.57,
  0.48, 0.09, 0.93, 0.73, 0.01, 0.49, 0.87, 0.91, 0.18, 1, 0.05, 0.65, 0.32,
  0.61, 0.27, 0.44, 0.51, 0.69, 0.43, 0.16, 0.31, 0.14, 0.47, 0.78, 0.56, 0.47,
  0.95, 0.47, 0.85, 0.05, 0.34, 0.29, 0.15, 0.62, 0.54, 0.36, 0.66, 0.74, 0.01,
  0.42, 0.07, 0.28, 0.44, 0.05, 0.16, 0.86, 0.4, 0.86, 0.93, 0.12, 0.75, 0.34,
  0.17, 0.47, 0.13, 0.08, 0.76, 0.22, 0.51, 0.04, 0.85, 0.67, 0.99, 0.4, 0.31,
  0.01, 0.85, 0.09, 0.84,
]
