import { createJob } from '@/queue/create-job'
import { InstallationLite } from '@octokit/webhooks-types'
import { dbClient } from '@/database/client'
import { createGithubClient } from '@/lib/github/create-github-client'
import { getIsOverPlanContributorLimit } from '@/lib/billing/get-is-over-plan-contributor-limit'
import { getOverContributorLimitMessage } from '@/lib/billing/get-over-contributor-limit-message'
import { logger } from '@/lib/log/logger'
import { getPullRequestLogData } from '@/lib/github/get-pull-request-log-data'
import { getOrganizationLogData } from '@/lib/organization/get-organization-log-data'
import { SimplePullRequest, PullRequestReview } from '@octokit/webhooks-types'
import crypto from 'node:crypto'
import { cloneRepository } from '@/lib/git/clone-repository'
import { getGithubAccessToken } from '@/lib/github/get-github-access-token'
import { execSync } from 'node:child_process'
import { deleteRepository } from '@/lib/git/delete-repository'
import { parseWriteCodeResult } from '@/lib/ai/parse-write-code-result'
import { getUpdateCodeFileCommand } from '@/lib/ai/get-update-code-file-command'

export const implementPullRequestReviewChanges = createJob({
  id: 'implement_pull_request_review_changes',
  handle: async (
    payload: {
      pull_request: SimplePullRequest
      installation: InstallationLite | undefined
      review: PullRequestReview
    },
    job,
  ) => {
    const { pull_request, installation, review } = payload
    const organization = await dbClient
      .selectFrom('homie.organization')
      .innerJoin(
        'github.organization',
        'github.organization.organization_id',
        'homie.organization.id',
      )
      .where('ext_gh_install_id', '=', installation?.id!)
      .select([
        'homie.organization.id',
        'github.organization.ext_gh_install_id',
        'has_unlimited_usage',
      ])
      .executeTakeFirst()

    logger.debug('Handle PR review changes', {
      event: 'handle_pr_review_changes:start',
      pull_request: getPullRequestLogData(pull_request),
    })

    if (!organization) {
      logger.debug('Missing organization', {
        event: 'handle_pr_review_changes:missing_org',
        pull_request: getPullRequestLogData(pull_request),
      })
      return
    }

    const github = await createGithubClient({
      installationId: organization.ext_gh_install_id,
    })

    const owner = pull_request.base.repo.full_name.split('/')[0]
    const repo = pull_request.base.repo.name

    const comments = await github.rest.pulls.listCommentsForReview({
      owner,
      pull_number: pull_request.number,
      repo: pull_request.base.repo.name,
      review_id: review.id,
    })

    const changes = comments.data
      .filter((comment) => {
        const commentBody = comment.body.trim()
        return commentBody.toLowerCase().startsWith('/homie')
      })
      .map((comment) => {
        const commentBody = comment.body.trim()

        return {
          file: comment.path,
          line: comment.line,
          instructions: commentBody.slice(commentBody.indexOf(' ') + 1),
          diff: comment.diff_hunk,
          commentId: comment.id,
        }
      })

    if (changes.length === 0) {
      return
    }

    if (await getIsOverPlanContributorLimit({ organization })) {
      logger.debug('Over plan contributor limit', {
        event: 'handle_pr_review_changes:over_plan_contributor_limit',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
      })

      github.rest.issues.createComment({
        owner,
        issue_number: pull_request.number,
        repo,
        body: getOverContributorLimitMessage(),
      })

      return
    }

    const accessToken = await getGithubAccessToken({
      github,
    })

    const gitCloneUrl = `https://x-access-token:${accessToken}@github.com/${owner}/${repo}.git`

    // Generate unique code job id
    const id = crypto
      .createHash('sha1')
      .update(
        [
          new Date().valueOf(), // timestamp
          job.id ?? '',
          organization.id,
          'update_pull_request',
          pull_request.number,
        ].join(' '),
      )
      .digest('hex')
      .substring(0, 7) // get first 7 chars, same as git commits

    const directory = cloneRepository({
      organization,
      url: gitCloneUrl,
      dirName: id,
    })

    execSync(`git fetch && git checkout ${pull_request.head.ref}`, {
      cwd: directory,
    })

    for (const change of changes) {
      const command = getUpdateCodeFileCommand({
        file: change.file,
        instructions: change.instructions,
        lineNumber: change.line,
      })

      const output = execSync(command, {
        cwd: directory,
      }).toString('utf-8')

      const result = await parseWriteCodeResult({ output })

      logger.debug('Got PR change result', {
        event: 'handle_pr_review_changes:change_result',
        pull_request: getPullRequestLogData(pull_request),
        organization: getOrganizationLogData(organization),
        change,
        result,
      })

      if (result.failed) {
        await github.rest.pulls.createReplyForReviewComment({
          owner,
          pull_number: pull_request.number,
          repo: pull_request.base.repo.name,
          comment_id: change.commentId,
          body: `Sorry, Homie couldn't make the requested changes right now. We'll try to do better next time.`,
        })

        continue
      }

      // Push the branch to remote
      execSync(`git push origin ${pull_request.head.ref}`, {
        cwd: directory,
      })

      await github.rest.pulls.createReplyForReviewComment({
        owner,
        pull_number: pull_request.number,
        repo: pull_request.base.repo.name,
        comment_id: change.commentId,
        body: `### Update:${result.title}\n${result.description}`,
      })
    }

    deleteRepository({ path: directory })
  },
})
