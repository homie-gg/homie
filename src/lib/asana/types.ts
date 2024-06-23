export interface AsanaOAuthTokenResponse {
  access_token: string
  refresh_token: string
}

export interface AsanaProject {
  gid: string
  name: string
  resource_type: 'project'
}

export interface AsanaWebhookCreateResponse {
  data: {
    gid: string
    resource: {
      gid: string
      name: string
    }
    target: string
    active: boolean
  }
}

export interface AsanaListProjectsResponse {
  data: AsanaProject[]
}

interface AsanaWorkspace {
  gid: string
  name: string
  resource_type: 'workspace'
}

export interface AsanaListWorkspacesResponsee {
  data: AsanaWorkspace[]
}

export type AsanaWebhookEvent =
  | {
      action: 'added'
      parent: {
        gid: string
        resource_type: 'section'
      }
      resource: {
        gid: string
        resource_type: 'task'
      }
    }
  | {
      action: 'changed'
      change: {
        field: 'html_notes'
        action: 'changed'
      }
      resource: {
        gid: string
        resource_type: 'task'
      }
    }
  | {
      action: 'added'
      user: {
        gid: string
        resource_type: 'user'
      }
      parent: {
        resource_type: 'task'
        gid: string
      }
      resource: {
        gid: string
        resource_type: 'story'
        resource_subtype: 'assigned'
      }
    }
  | {
      action: 'changed'
      change: {
        field: 'assignee'
        action: 'changed'
      }
      user: {
        gid: string
        resource_type: 'user'
      }
      resource: {
        gid: string
        resource_type: 'task'
      }
    }
  | {
      action: 'deleted'
      user: {
        gid: string
        resource_type: 'user'
      }
      resource: {
        gid: string
        resource_type: 'task'
      }
    }
  | {
      action: 'changed'
      change: {
        field: 'name'
        action: 'changed'
      }
      resource: {
        gid: string
        resource_type: 'task'
      }
    }

export interface AsanaGetWorkspaceResponse {
  data: {
    workspace: {
      gid: string
      name: string
    }
  }
}

interface AsanaWebhook {
  gid: string
  resource: {
    resource_type: string
    gid: string
  }
}

export interface AsanaListWebhooksResponse {
  data: AsanaWebhook[]
}

interface AsanaTask {
  gid: string
  name: string
  notes: string
  permalink_url: string
  completed: boolean
  /**
   * Due date in ISO format. This is only returned if a time is set, otherwise
   * only due_on is set for a day.
   */
  due_at: string | null
  /**
   * Due date without time.
   */
  due_on: string | null
  assignee: {
    gid: string
    name: string
    resource_type: 'user'
  } | null
}

export interface AsanaGetTaskResponse {
  data: AsanaTask
}

export interface AsanaUser {
  gid: string
  name: string
}

export interface GetAsanaUsersResponse {
  data: AsanaUser[]
}

export interface ListAsanaTasksResponse {
  data: AsanaTask[]
}
