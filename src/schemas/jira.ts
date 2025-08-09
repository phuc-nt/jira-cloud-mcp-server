/**
 * Schema definitions for Jira tools
 */
import { standardMetadataSchema } from './common.js';

/**
 * Schema for Jira issue
 */
export const issueSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Issue ID" },
    key: { type: "string", description: "Issue key (e.g., PROJ-123)" },
    summary: { type: "string", description: "Issue title/summary" },
    description: { anyOf: [
      { type: "string", description: "Issue description as plain text" },
      { type: "object", description: "Issue description in ADF format" }
    ], nullable: true },
    rawDescription: { anyOf: [
      { type: "string", description: "Issue description as plain text" },
      { type: "object", description: "Issue description in ADF format" }
    ], nullable: true },
    status: { 
      type: "object", 
      properties: {
        name: { type: "string", description: "Status name" },
        id: { type: "string", description: "Status ID" }
      }
    },
    assignee: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Assignee's display name" },
        accountId: { type: "string", description: "Assignee's account ID" }
      },
      nullable: true
    },
    reporter: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Reporter's display name" },
        accountId: { type: "string", description: "Reporter's account ID" }
      },
      nullable: true
    },
    priority: {
      type: "object",
      properties: {
        name: { type: "string", description: "Priority name" },
        id: { type: "string", description: "Priority ID" }
      },
      nullable: true
    },
    labels: {
      type: "array",
      items: { type: "string" },
      description: "List of labels attached to the issue"
    },
    created: { type: "string", format: "date-time", description: "Creation date" },
    updated: { type: "string", format: "date-time", description: "Last update date" },
    issueType: {
      type: "object",
      properties: {
        name: { type: "string", description: "Issue type name" },
        id: { type: "string", description: "Issue type ID" }
      }
    },
    projectKey: { type: "string", description: "Project key" },
    projectName: { type: "string", description: "Project name" }
  },
  required: ["id", "key", "summary", "status", "issueType", "projectKey"]
};

/**
 * Schema for Jira issues list
 */
export const issuesListSchema = {
  type: "object",
  properties: {
    metadata: standardMetadataSchema,
    issues: {
      type: "array",
      items: issueSchema
    }
  },
  required: ["metadata", "issues"]
};

/**
 * Schema for Jira transitions
 */
export const transitionSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Transition ID" },
    name: { type: "string", description: "Transition name" },
    to: {
      type: "object",
      properties: {
        id: { type: "string", description: "Status ID after transition" },
        name: { type: "string", description: "Status name after transition" }
      }
    }
  },
  required: ["id", "name"]
};

/**
 * Schema for Jira transitions list
 */
export const transitionsListSchema = {
  type: "object",
  properties: {
    issueKey: { type: "string", description: "Issue key" },
    transitions: {
      type: "array",
      items: transitionSchema
    }
  },
  required: ["issueKey", "transitions"]
};

/**
 * Schema for Jira project
 */
export const projectSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Project ID" },
    key: { type: "string", description: "Project key" },
    name: { type: "string", description: "Project name" },
    projectTypeKey: { type: "string", description: "Project type" },
    url: { type: "string", description: "Project URL" },
    lead: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Project lead's display name" },
        accountId: { type: "string", description: "Project lead's account ID" }
      },
      nullable: true
    }
  },
  required: ["id", "key", "name"]
};

/**
 * Schema for Jira projects list
 */
export const projectsListSchema = {
  type: "object",
  properties: {
    metadata: standardMetadataSchema,
    projects: {
      type: "array",
      items: projectSchema
    }
  },
  required: ["metadata", "projects"]
};

/**
 * Schema for Jira user
 */
export const userSchema = {
  type: "object",
  properties: {
    accountId: { type: "string", description: "User account ID" },
    displayName: { type: "string", description: "User display name" },
    emailAddress: { type: "string", description: "User email address", nullable: true },
    active: { type: "boolean", description: "Whether the user is active" },
    avatarUrl: { type: "string", description: "URL to user avatar" },
    timeZone: { type: "string", description: "User timezone", nullable: true },
    locale: { type: "string", description: "User locale", nullable: true }
  },
  required: ["accountId", "displayName", "active"]
};

/**
 * Schema for Jira users list
 */
export const usersListSchema = {
  type: "object",
  properties: {
    metadata: standardMetadataSchema,
    users: {
      type: "array",
      items: userSchema
    }
  },
  required: ["metadata", "users"]
};

/**
 * Schema for Jira comment
 */
export const commentSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Comment ID" },
    body: { anyOf: [
      { type: "string", description: "Comment body as plain text" },
      { type: "object", description: "Comment body in ADF format" }
    ] },
    rawBody: { anyOf: [
      { type: "string", description: "Comment body as plain text" },
      { type: "object", description: "Comment body in ADF format" }
    ] },
    author: {
      type: "object",
      properties: {
        displayName: { type: "string", description: "Author's display name" },
        accountId: { type: "string", description: "Author's account ID" }
      }
    },
    created: { type: "string", format: "date-time", description: "Creation date" },
    updated: { type: "string", format: "date-time", description: "Last update date" }
  },
  required: ["id", "body", "author", "created"]
};

/**
 * Schema for Jira comments list
 */
export const commentsListSchema = {
  type: "object",
  properties: {
    metadata: standardMetadataSchema,
    comments: {
      type: "array",
      items: commentSchema
    },
    issueKey: { type: "string", description: "Issue key" }
  },
  required: ["metadata", "comments", "issueKey"]
};

// Filter schemas
export const filterSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Filter ID" },
    name: { type: "string", description: "Filter name" },
    jql: { type: "string", description: "JQL query" },
    description: { type: "string", description: "Filter description" },
    owner: { 
      type: "object", 
      properties: {
        displayName: { type: "string" },
        accountId: { type: "string" }
      }
    },
    favourite: { type: "boolean", description: "Whether the filter is favorited" },
    sharePermissions: { type: "array", description: "Share permissions" }
  }
};

export const filterListSchema = {
  type: "object",
  properties: {
    filters: {
      type: "array",
      items: filterSchema
    },
    metadata: standardMetadataSchema
  }
};

// Board schemas
export const boardSchema = {
  type: "object",
  properties: {
    id: { type: "number", description: "Board ID" },
    name: { type: "string", description: "Board name" },
    type: { type: "string", description: "Board type (scrum, kanban)" },
    location: { 
      type: "object", 
      properties: {
        projectId: { type: "string" },
        displayName: { type: "string" },
        projectKey: { type: "string" },
        projectName: { type: "string" }
      }
    }
  }
};

export const boardListSchema = {
  type: "object",
  properties: {
    boards: {
      type: "array",
      items: boardSchema
    },
    metadata: standardMetadataSchema
  }
};

// Sprint schemas
export const sprintSchema = {
  type: "object",
  properties: {
    id: { type: "number", description: "Sprint ID" },
    name: { type: "string", description: "Sprint name" },
    state: { type: "string", description: "Sprint state (future, active, closed)" },
    startDate: { type: "string", description: "Start date" },
    endDate: { type: "string", description: "End date" },
    goal: { type: "string", description: "Sprint goal" },
    originBoardId: { type: "number", description: "Board ID" }
  }
};

export const sprintListSchema = {
  type: "object",
  properties: {
    sprints: {
      type: "array",
      items: sprintSchema
    },
    metadata: standardMetadataSchema
  }
};

// Dashboard schemas
export const dashboardSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Dashboard ID" },
    name: { type: "string", description: "Dashboard name" },
    description: { type: "string", description: "Dashboard description", nullable: true },
    owner: {
      type: "object",
      properties: {
        displayName: { type: "string" },
        accountId: { type: "string" }
      },
      nullable: true
    },
    sharePermissions: { type: "array", description: "Share permissions", items: { type: "object" }, nullable: true },
    gadgets: { type: "array", items: { type: "object" }, nullable: true },
    isFavourite: { type: "boolean", description: "Is favourite", nullable: true },
    view: { type: "string", description: "View type", nullable: true },
    url: { type: "string", description: "Dashboard URL", nullable: true }
  },
  required: ["id", "name"]
};

export const dashboardListSchema = {
  type: "object",
  properties: {
    dashboards: { type: "array", items: dashboardSchema },
    total: { type: "number", description: "Total dashboards" },
    maxResults: { type: "number", description: "Max results per page" },
    startAt: { type: "number", description: "Start offset" },
    metadata: standardMetadataSchema
  },
  required: ["dashboards", "total"]
};

// Gadget schemas
export const gadgetSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Gadget ID" },
    title: { type: "string", description: "Gadget title" },
    color: { type: "string", description: "Gadget color", nullable: true },
    position: { type: "object", description: "Gadget position", nullable: true },
    uri: { type: "string", description: "Gadget URI", nullable: true },
    properties: { type: "object", description: "Gadget properties", nullable: true }
  },
  required: ["id", "title"]
};

export const gadgetListSchema = {
  type: "object",
  properties: {
    gadgets: { type: "array", items: gadgetSchema },
    metadata: standardMetadataSchema
  },
  required: ["gadgets"]
}; 

// Fix Version schemas (Sprint 4.4)
export const fixVersionSchema = {
  type: "object",
  properties: {
    id: { type: "string", description: "Version ID" },
    name: { type: "string", description: "Version name" },
    description: { type: "string", description: "Version description", nullable: true },
    archived: { type: "boolean", description: "Whether version is archived" },
    released: { type: "boolean", description: "Whether version is released" },
    releaseDate: { type: "string", description: "Release date (YYYY-MM-DD)", nullable: true },
    startDate: { type: "string", description: "Start date (YYYY-MM-DD)", nullable: true },
    projectId: { type: "string", description: "Project ID" },
    self: { type: "string", description: "Version URL" },
    issuesFixedCount: { type: "number", description: "Number of issues fixed" },
    issuesToDoCount: { type: "number", description: "Number of issues to do" },
    issuesInProgressCount: { type: "number", description: "Number of issues in progress" },
    operations: { type: "array", description: "Available operations" }
  },
  required: ["id", "name", "archived", "released"]
};

export const projectVersionsListSchema = {
  type: "object",
  properties: {
    projectKey: { type: "string", description: "Project key" },
    totalVersions: { type: "number", description: "Total number of versions" },
    releasedVersions: { type: "number", description: "Number of released versions" },
    unreleasedVersions: { type: "number", description: "Number of unreleased versions" },
    archivedVersions: { type: "number", description: "Number of archived versions" },
    versions: { type: "array", items: fixVersionSchema },
    metadata: standardMetadataSchema
  },
  required: ["projectKey", "totalVersions", "versions"]
};