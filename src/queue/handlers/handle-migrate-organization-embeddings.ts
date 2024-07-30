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

  const randomSearchVector = await embedder.embedQuery('any string')

  console.log(`Migration organization ${organization.id} embeddings`, {
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

  console.log('Got pull_request_diff(s)', {
    event: 'migrate_org_embeddings:got_pr_diff',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
  })

  for (const pullRequestDiff of pullRequestDiffs.matches) {
    const text = pullRequestDiff.metadata?.text ?? ''
    if (!text || typeof text !== 'string') {
      continue
    }

    namespaceIndex.upsert([
      {
        id: pullRequestDiff.id,
        values: await embedder.embedQuery(text),
        metadata: pullRequestDiff.metadata,
      },
    ])
  }

  console.log('Finished migrating PR diffs', {
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

  console.log('Got pr changes', {
    event: 'migrate_org_embeddings:got_pr_changes',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
  })

  for (const pullRequestChange of pullRequestChanges.matches) {
    const text = pullRequestChange.metadata?.text ?? ''
    if (!text || typeof text !== 'string') {
      continue
    }
    namespaceIndex.upsert([
      {
        id: pullRequestChange.id,
        values: await embedder.embedQuery(text),
        metadata: pullRequestChange.metadata,
      },
    ])
  }

  console.log('Finished PR changes', {
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

  console.log('Got conversations', {
    event: 'migrate_org_embeddings:got_conversations',
    organization_id: organization.id,
    num_pull_request_diffs: pullRequestDiffs.matches.length,
    num_pull_request_changes: pullRequestChanges.matches.length,
    num_conversations: conversations.matches.length,
  })

  for (const conversation of conversations.matches) {
    const text = conversation.metadata?.text ?? ''
    if (!text || typeof text !== 'string') {
      continue
    }

    namespaceIndex.upsert([
      {
        id: conversation.id,
        values: await embedder.embedQuery(text),
        metadata: conversation.metadata,
      },
    ])
  }

  console.log('Finished conversations', {
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

  console.log('Got PR summaries', {
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

  console.log('Finished PR summaries', {
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

  console.log('Got MR summaries', {
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

  console.log('Finished MR summaries', {
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

  console.log('Got Diffs', {
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

  console.log('Finished Diffs', {
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
