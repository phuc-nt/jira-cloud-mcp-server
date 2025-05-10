import { AtlassianConfig, logger, createBasicHeaders } from './atlassian-api-base.js';
import { normalizeAtlassianBaseUrl } from './atlassian-api-base.js';
import { ApiError, ApiErrorType } from './error-handler.js';

// Tạo issue mới
export async function createIssue(
  config: AtlassianConfig,
  projectKey: string,
  summary: string,
  description?: string,
  issueType: string = "Task",
  additionalFields: Record<string, any> = {}
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue`;
    const data: {
      fields: {
        project: { key: string };
        summary: string;
        issuetype: { name: string };
        description?: any;
        [key: string]: any;
      };
    } = {
      fields: {
        project: {
          key: projectKey,
        },
        summary: summary,
        issuetype: {
          name: issueType,
        },
        ...additionalFields,
      },
    };
    if (description) {
      data.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: description,
              },
            ],
          },
        ],
      };
    }
    logger.debug(`Creating issue in project ${projectKey}`);
    const curlCmd = `curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(
      data
    )}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "omit",
    });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid issue data",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "No permission to create issue",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 429) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          "API rate limit exceeded",
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }
    const newIssue = await response.json();
    return newIssue;
  } catch (error: any) {
    logger.error(`Error creating issue:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error creating issue: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Cập nhật issue
export async function updateIssue(
  config: AtlassianConfig,
  issueIdOrKey: string,
  fields: Record<string, any>
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}`;
    const data = {
      fields: fields,
    };
    logger.debug(`Updating issue ${issueIdOrKey}`);
    const curlCmd = `curl -X PUT -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(
      data
    )}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      credentials: "omit",
    });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid update data",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "No permission to update issue",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Issue ${issueIdOrKey} does not exist`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 429) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          "API rate limit exceeded",
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }
    return {
      success: true,
      message: `Issue ${issueIdOrKey} updated successfully`,
    };
  } catch (error: any) {
    logger.error(`Error updating issue ${issueIdOrKey}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error updating issue: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Chuyển trạng thái issue
export async function transitionIssue(
  config: AtlassianConfig,
  issueIdOrKey: string,
  transitionId: string,
  comment?: string
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}/transitions`;
    const data: any = {
      transition: {
        id: transitionId,
      },
    };
    if (comment) {
      data.update = {
        comment: [
          {
            add: {
              body: {
                type: "doc",
                version: 1,
                content: [
                  {
                    type: "paragraph",
                    content: [
                      {
                        type: "text",
                        text: comment,
                      },
                    ],
                  },
                ],
              },
            },
          },
        ],
      };
    }
    logger.debug(
      `Transitioning issue ${issueIdOrKey} to status ID ${transitionId}`
    );
    const curlCmd = `curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(
      data
    )}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(data),
      credentials: "omit",
    });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid transition ID or not applicable",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "No permission to transition issue",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Issue ${issueIdOrKey} does not exist`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 429) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          "API rate limit exceeded",
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }
    return {
      success: true,
      message: `Issue ${issueIdOrKey} transitioned successfully`,
      transitionId,
    };
  } catch (error: any) {
    logger.error(`Error transitioning issue ${issueIdOrKey}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error transitioning issue: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Gán issue cho user
export async function assignIssue(
  config: AtlassianConfig,
  issueIdOrKey: string,
  accountId: string | null
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}/assignee`;
    const data = {
      accountId: accountId,
    };
    logger.debug(
      `Assigning issue ${issueIdOrKey} to account ID ${
        accountId || "UNASSIGNED"
      }`
    );
    const curlCmd = `curl -X PUT -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(
      data
    )}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const response = await fetch(url, {
      method: "PUT",
      headers,
      body: JSON.stringify(data),
      credentials: "omit",
    });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid data",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "No permission to assign issue",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Issue ${issueIdOrKey} does not exist`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 429) {
        throw new ApiError(
          ApiErrorType.RATE_LIMIT_ERROR,
          "API rate limit exceeded",
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }
    return {
      success: true,
      message: accountId
        ? `Issue ${issueIdOrKey} assigned successfully`
        : `Issue ${issueIdOrKey} unassigned successfully`,
    };
  } catch (error: any) {
    logger.error(`Error assigning issue ${issueIdOrKey}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error assigning issue: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Create a new Jira dashboard
 * Endpoint: POST /rest/api/3/dashboard
 * Payload: { name, description, sharePermissions }
 */
export async function createDashboard(config: AtlassianConfig, data: { name: string, description?: string, sharePermissions?: any[] }): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/dashboard`;
    logger.debug(`Creating dashboard: ${data.name}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error creating dashboard:`, error);
    throw error;
  }
}

/**
 * Update a Jira dashboard
 * Endpoint: PUT /rest/api/3/dashboard/{dashboardId}
 * Payload: { name?, description?, sharePermissions? }
 */
export async function updateDashboard(config: AtlassianConfig, dashboardId: string, data: { name?: string, description?: string, sharePermissions?: any[] }): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}`;
    logger.debug(`Updating dashboard ${dashboardId}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error updating dashboard ${dashboardId}:`, error);
    throw error;
  }
}

/**
 * Add gadget to dashboard
 * Endpoint: POST /rest/api/3/dashboard/{dashboardId}/gadget
 * Payload: { uri, color, position, title, properties? }
 */
export async function addGadgetToDashboard(config: AtlassianConfig, dashboardId: string, data: { uri: string, color?: string, position?: any, title?: string, properties?: any }): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}/gadget`;
    logger.debug(`Adding gadget to dashboard ${dashboardId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error adding gadget to dashboard ${dashboardId}:`, error);
    throw error;
  }
}

/**
 * Remove gadget from dashboard
 * Endpoint: DELETE /rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}
 */
export async function removeGadgetFromDashboard(config: AtlassianConfig, dashboardId: string, gadgetId: string): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}/gadget/${gadgetId}`;
    logger.debug(`Removing gadget ${gadgetId} from dashboard ${dashboardId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return { success: true };
  } catch (error) {
    logger.error(`Error removing gadget ${gadgetId} from dashboard ${dashboardId}:`, error);
    throw error;
  }
}

/**
 * Add issues to backlog
 * Endpoint: POST /rest/agile/1.0/backlog/issue
 * Payload: { issues: [issueKey] }
 */
export async function addIssuesToBacklog(config: AtlassianConfig, boardId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
    const data = { issues: issueKeys };
    logger.debug(`Adding issues to backlog: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error adding issues to backlog:`, error);
    throw error;
  }
}

/**
 * Remove issues from backlog (move to sprint)
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}/issue
 * Payload: { issues: [issueKey] }
 */
export async function removeIssuesFromBacklog(config: AtlassianConfig, boardId: string, sprintId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`;
    const data = { issues: issueKeys };
    logger.debug(`Moving issues from backlog to sprint ${sprintId}: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error moving issues from backlog to sprint:`, error);
    throw error;
  }
}

/**
 * Rank backlog issues
 * Endpoint: PUT /rest/agile/1.0/issue/rank
 * Payload: { issues: [issueKey], rankBeforeIssue?, rankAfterIssue? }
 */
export async function rankBacklogIssues(config: AtlassianConfig, boardId: string, issueKeys: string[], options: { rankBeforeIssue?: string, rankAfterIssue?: string } = {}): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/issue/rank`;
    const data: any = { issues: issueKeys };
    if (options.rankBeforeIssue) data.rankBeforeIssue = options.rankBeforeIssue;
    if (options.rankAfterIssue) data.rankAfterIssue = options.rankAfterIssue;
    logger.debug(`Ranking issues in backlog: ${issueKeys.join(', ')}`);
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error ranking backlog issues:`, error);
    throw error;
  }
}

/**
 * Start a Jira sprint
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}
 * Payload: { state: 'active', startDate, endDate, goal }
 */
export async function startSprint(config: AtlassianConfig, sprintId: string, startDate: string, endDate: string, goal?: string): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
    const data: any = {
      state: 'active',
      startDate,
      endDate
    };
    if (goal) data.goal = goal;
    logger.debug(`Starting sprint ${sprintId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error starting sprint ${sprintId}:`, error);
    throw error;
  }
}

/**
 * Close a Jira sprint
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}
 * Payload: { state: 'closed', completeDate, moveToSprintId?, createNewSprint? }
 */
export async function closeSprint(config: AtlassianConfig, sprintId: string, options: { completeDate?: string, moveToSprintId?: string, createNewSprint?: boolean } = {}): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
    const data: any = {
      state: 'closed',
      ...options
    };
    logger.debug(`Closing sprint ${sprintId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error closing sprint ${sprintId}:`, error);
    throw error;
  }
}

/**
 * Move issues between sprints
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}/issue
 * Payload: { issues: [issueKey], remove?: true }
 */
export async function moveIssuesBetweenSprints(config: AtlassianConfig, fromSprintId: string, toSprintId: string, issueKeys: string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    logger.debug(`Moving issues from sprint ${fromSprintId} to sprint ${toSprintId}: ${issueKeys.join(', ')}`);
    
    // Remove from old sprint
    const removeUrl = `${baseUrl}/rest/agile/1.0/sprint/${fromSprintId}/issue`;
    const removeResponse = await fetch(removeUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ issues: issueKeys, remove: true }),
      credentials: 'omit',
    });
    
    if (!removeResponse.ok) {
      const responseText = await removeResponse.text();
      logger.error(`Jira API error (${removeResponse.status}):`, responseText);
      throw new Error(`Jira API error: ${removeResponse.status} ${responseText}`);
    }
    
    // Add to new sprint
    const addUrl = `${baseUrl}/rest/agile/1.0/sprint/${toSprintId}/issue`;
    const addResponse = await fetch(addUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({ issues: issueKeys }),
      credentials: 'omit',
    });
    
    if (!addResponse.ok) {
      const responseText = await addResponse.text();
      logger.error(`Jira API error (${addResponse.status}):`, responseText);
      throw new Error(`Jira API error: ${addResponse.status} ${responseText}`);
    }
    
    return await addResponse.json();
  } catch (error) {
    logger.error(`Error moving issues between sprints:`, error);
    throw error;
  }
}

/**
 * Add issue to board
 * Endpoint: POST /rest/agile/1.0/backlog/issue
 * Payload: { issues: [issueKey] }
 */
export async function addIssueToBoard(config: AtlassianConfig, boardId: string, issueKey: string | string[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
    const issues = Array.isArray(issueKey) ? issueKey : [issueKey];
    const data = { issues };
    logger.debug(`Adding issue(s) to board ${boardId}: ${Array.isArray(issueKey) ? issueKey.join(', ') : issueKey}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error adding issue to board:`, error);
    throw error;
  }
}

/**
 * Configure board columns
 * Endpoint: PUT /rest/agile/1.0/board/{boardId}/configuration
 * Payload: { ...boardConfig, columnConfig: { columns: [...] } }
 */
export async function configureBoardColumns(config: AtlassianConfig, boardId: string, columns: any[]): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/configuration`;
    logger.debug(`Configuring columns for board ${boardId}`);
    
    // Lấy config hiện tại để merge
    const currentRes = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!currentRes.ok) {
      const responseText = await currentRes.text();
      logger.error(`Jira API error (${currentRes.status}):`, responseText);
      throw new Error(`Jira API error: ${currentRes.status} ${responseText}`);
    }
    
    const currentConfig = await currentRes.json();
    const data = { ...currentConfig, columnConfig: { columns } };
    
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error(`Error configuring board columns:`, error);
    throw error;
  }
}

/**
 * Create a new Jira filter
 */
export async function createFilter(
  config: AtlassianConfig,
  name: string,
  jql: string,
  description?: string,
  favourite?: boolean
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/filter`;
    const data: any = {
      name,
      jql,
      description: description || '',
      favourite: favourite !== undefined ? favourite : false
    };
    logger.debug(`Creating Jira filter: ${name}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    return await response.json();
  } catch (error) {
    logger.error(`Error creating Jira filter:`, error);
    throw error;
  }
}

/**
 * Update an existing Jira filter
 */
export async function updateFilter(
  config: AtlassianConfig,
  filterId: string,
  updateData: { name?: string; jql?: string; description?: string; favourite?: boolean }
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
    logger.debug(`Updating Jira filter ${filterId}`);
    
    // Lấy filter hiện tại để merge (API yêu cầu PUT phải đủ trường)
    const current = await (async () => {
      const res = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
      if (!res.ok) {
        const responseText = await res.text();
        logger.error(`Jira API error (${res.status}):`, responseText);
        throw new Error(`Jira API error: ${res.status} ${responseText}`);
      }
      return await res.json();
    })();
    
    const data = { ...current, ...updateData };
    const response = await fetch(url, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error(`Error updating Jira filter ${filterId}:`, error);
    throw error;
  }
}

/**
 * Delete a Jira filter
 */
export async function deleteFilter(
  config: AtlassianConfig,
  filterId: string
): Promise<void> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
    logger.debug(`Deleting Jira filter ${filterId}`);
    const response = await fetch(url, {
      method: 'DELETE',
      headers,
      credentials: 'omit',
    });
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
  } catch (error) {
    logger.error(`Error deleting Jira filter ${filterId}:`, error);
    throw error;
  }
}

/**
 * Create a new Jira sprint (Agile)
 */
export async function createSprint(
  config: AtlassianConfig,
  boardId: string,
  name: string,
  startDate?: string,
  endDate?: string,
  goal?: string
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/agile/1.0/sprint`;
    const data: any = {
      name,
      originBoardId: boardId
    };
    if (startDate) data.startDate = startDate;
    if (endDate) data.endDate = endDate;
    if (goal) data.goal = goal;
    
    logger.debug(`Creating new sprint "${name}" for board ${boardId}`);
    const response = await fetch(url, {
      method: 'POST',
      headers,
      body: JSON.stringify(data),
      credentials: 'omit',
    });
    
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (${response.status}):`, responseText);
      throw new Error(`Jira API error: ${response.status} ${responseText}`);
    }
    
    return await response.json();
  } catch (error) {
    logger.error(`Error creating sprint:`, error);
    throw error;
  }
} 