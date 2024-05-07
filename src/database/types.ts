import { SelectableForTable } from 'zapatos/schema'

export type Organization = SelectableForTable<'homie.organization'>
export type Contributor = SelectableForTable<'homie.contributor'>
export type Plan = SelectableForTable<'homie.plan'>
export type Subscription = SelectableForTable<'homie.plan'>
export type PullRequest = SelectableForTable<'homie.pull_request'>

export type GithubOrganization = SelectableForTable<'github.organization'>
export type GithubRepo = SelectableForTable<'github.repo'>

export type GitlabProject = SelectableForTable<'gitlab.project'>

export type TrelloWorkspace = SelectableForTable<'trello.workspace'>
