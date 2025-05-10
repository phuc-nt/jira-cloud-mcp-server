import { AtlassianConfig, logger, createBasicHeaders } from './atlassian-api-base.js';
import { normalizeAtlassianBaseUrl } from './atlassian-api-base.js';
import { ApiError, ApiErrorType } from './error-handler.js';

// Helper: Fetch Jira create metadata for a project/issueType
export async function fetchJiraCreateMeta(
  config: AtlassianConfig,
  projectKey: string,
  issueType: string
): Promise<Record<string, any>> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  // Lấy metadata cho project và issueType (dùng name hoặc id)
  const url = `${baseUrl}/rest/api/3/issue/createmeta?projectKeys=${encodeURIComponent(projectKey)}&issuetypeNames=${encodeURIComponent(issueType)}&expand=projects.issuetypes.fields`;
  const response = await fetch(url, { headers, credentials: 'omit' });
  if (!response.ok) {
    const responseText = await response.text();
    logger.error(`Jira API error (createmeta, ${response.status}):`, responseText);
    throw new Error(`Jira API error (createmeta): ${response.status} ${responseText}`);
  }
  const meta = await response.json();
  // Trả về object các trường hợp lệ
  try {
    const fields = meta.projects?.[0]?.issuetypes?.[0]?.fields || {};
    return fields;
  } catch (e) {
    logger.error('Cannot parse createmeta fields', e);
    return {};
  }
}

// Create a new Jira issue (fix: chỉ gửi các trường có trong createmeta)
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

    // Lấy metadata các trường hợp lệ
    const createmetaFields = await fetchJiraCreateMeta(config, projectKey, issueType);
    
    // Chỉ map các trường có trong createmeta
    const safeFields: Record<string, any> = {};
    let labelsToUpdate: string[] | undefined = undefined;
    for (const key of Object.keys(additionalFields)) {
      if (createmetaFields[key]) {
        safeFields[key] = additionalFields[key];
      } else {
        logger.warn(`[createIssue] Field '${key}' is not available on create screen for project ${projectKey} / issueType ${issueType}, will be ignored.`);
        // Nếu là labels thì lưu lại để update sau
        if (key === 'labels') {
          labelsToUpdate = additionalFields[key];
        }
      }
    }

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
        project: { key: projectKey },
        summary: summary,
        issuetype: { name: issueType },
        ...safeFields,
      },
    };

    if (description && createmetaFields['description']) {
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
    const curlCmd = `curl -X POST -H \"Content-Type: application/json\" -H \"Accept: application/json\" -H \"User-Agent: MCP-Atlassian-Server/1.0.0\" -u \"${config.email}:${config.apiToken.substring(0, 5)}...\" \"${url}\" -d '${JSON.stringify(data)}'`;
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

    // Nếu không tạo được labels khi tạo issue, update lại ngay sau khi tạo
    if (labelsToUpdate && newIssue && newIssue.key) {
      logger.info(`[createIssue] Updating labels for issue ${newIssue.key} ngay sau khi tạo (do không khả dụng trên màn hình tạo issue)`);
      const updateUrl = `${baseUrl}/rest/api/3/issue/${newIssue.key}`;
      const updateData = { fields: { labels: labelsToUpdate } };
      const updateResponse = await fetch(updateUrl, {
        method: "PUT",
        headers,
        body: JSON.stringify(updateData),
        credentials: "omit",
      });
      if (!updateResponse.ok) {
        const updateText = await updateResponse.text();
        logger.error(`[createIssue] Failed to update labels for issue ${newIssue.key}:`, updateText);
      } else {
        logger.info(`[createIssue] Labels updated for issue ${newIssue.key}`);
      }
    }

    return newIssue;
  } catch (error) {
    logger.error(`Error creating issue:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error creating issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Update a Jira issue
export async function updateIssue(
  config: AtlassianConfig,
  issueIdOrKey: string,
  fields: Record<string, any>
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}`;
    const data = { fields };
    logger.debug(`Updating issue ${issueIdOrKey}`);
    const curlCmd = `curl -X PUT -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(data)}'`;
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
      `Error updating issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Change issue status
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
    logger.debug(`Transitioning issue ${issueIdOrKey} to status ID ${transitionId}`);
    const curlCmd = `curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(data)}'`;
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
      `Error transitioning issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Assign issue to a user
export async function assignIssue(
  config: AtlassianConfig,
  issueIdOrKey: string,
  accountId: string | null
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}/assignee`;
    const data = { accountId: accountId };
    logger.debug(`Assigning issue ${issueIdOrKey} to account ID ${accountId || "UNASSIGNED"}`);
    const curlCmd = `curl -X PUT -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${config.email}:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(data)}'`;
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
      `Error assigning issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Create a new dashboard
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

// Update a dashboard
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

// Add a gadget to a dashboard
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

// Remove a gadget from a dashboard
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

// Create a new filter
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

// Update a filter
export async function updateFilter(
  config: AtlassianConfig,
  filterId: string,
  updateData: { name?: string; jql?: string; description?: string; favourite?: boolean; sharePermissions?: any[] }
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
    logger.debug(`Updating Jira filter ${filterId}`);
    // Chỉ build payload với các trường hợp lệ
    const allowedFields = ['name', 'jql', 'description', 'favourite', 'sharePermissions'] as const;
    type AllowedField = typeof allowedFields[number];
    const data: any = {};
    for (const key of allowedFields) {
      if (updateData[key as AllowedField] !== undefined) {
        data[key] = updateData[key as AllowedField];
      }
    }
    logger.debug('Payload for updateFilter:', JSON.stringify(data));
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

// Delete a filter
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

// Lấy danh sách tất cả gadget có sẵn để thêm vào dashboard
export async function getJiraAvailableGadgets(config: AtlassianConfig): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard/gadgets`;
  const response = await fetch(url, { headers, credentials: 'omit' });
  if (!response.ok) {
    const responseText = await response.text();
    logger.error(`Jira API error (gadgets, ${response.status}):`, responseText);
    throw new Error(`Jira API error (gadgets): ${response.status} ${responseText}`);
  }
  return await response.json();
} 