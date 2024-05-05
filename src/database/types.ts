import { SelectableForTable } from 'zapatos/schema'

export type Organization = SelectableForTable<'homie.organization'>
export type Contributor = SelectableForTable<'homie.contributor'>
export type Plan = SelectableForTable<'homie.plan'>
export type Subscription = SelectableForTable<'homie.plan'>

export type GithubOrganization = SelectableForTable<'github.organization'>
export type GithubPullRequest = SelectableForTable<'github.pull_request'>
export type GithubRepo = SelectableForTable<'github.repo'>

export type TrelloWorkspace = SelectableForTable<'trello.workspace'>
