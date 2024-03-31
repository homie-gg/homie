import { SelectableForTable } from 'zapatos/schema'

export type Organization = SelectableForTable<'voidpm.organization'>
export type Contributor = SelectableForTable<'voidpm.contributor'>

export type GithubOrganization = SelectableForTable<'github.organization'>
export type GithubPullRequest = SelectableForTable<'github.pull_request'>
export type GithubRepo = SelectableForTable<'github.repo'>
