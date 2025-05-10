import { AtlassianConfig, logger, createBasicHeaders } from './atlassian-api-base.js';
import { normalizeAtlassianBaseUrl } from './atlassian-api.js';
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