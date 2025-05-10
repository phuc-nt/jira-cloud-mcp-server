import { Version3Client, Version3Models } from "jira.js";
import { ApiError, ApiErrorType } from "./error-handler.js";
import { logger, clientCache, createBasicHeaders, AtlassianConfig } from "./atlassian-api-base.js";
import fetch from "cross-fetch";

/**
 * Utilities for calling Atlassian APIs (Jira, Confluence)
 */

/**
 * Create or get Jira client from cache
 * @param config Atlassian config
 * @returns Jira API client
 */
export function getJiraClient(config: AtlassianConfig): Version3Client {
  const cacheKey = `jira:${config.baseUrl}:${config.email}`;
  if (clientCache.has(cacheKey)) {
    return clientCache.get(cacheKey) as Version3Client;
  }
  logger.debug(`Creating new Jira client for ${config.baseUrl}`);
  // Normalize baseUrl
  let baseUrl = config.baseUrl;
  if (baseUrl.startsWith("http://")) {
    baseUrl = baseUrl.replace("http://", "https://");
  } else if (!baseUrl.startsWith("https://")) {
    baseUrl = `https://${baseUrl}`;
  }
  // Ensure .atlassian.net in URL
  if (!baseUrl.includes(".atlassian.net")) {
    baseUrl = `${baseUrl}.atlassian.net`;
  }
  // Handle duplicate .atlassian.net
  if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
    baseUrl = baseUrl.replace(".atlassian.net.atlassian.net", ".atlassian.net");
  }
  // Create Jira client using jira.js
  const client = new Version3Client({
    host: baseUrl,
    authentication: {
      basic: {
        email: config.email,
        apiToken: config.apiToken,
      },
    },
    baseRequestConfig: {
      headers: {
        "User-Agent": "MCP-Atlassian-Server/1.0.0",
      },
    },
  });
  // Save to cache for reuse
  clientCache.set(cacheKey, client);
  return client;
}

/**
 * Call Jira API using jira.js
 * @param config Atlassian config (baseUrl, apiToken, email)
 * @param endpoint API endpoint path
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param data Request body
 * @param params Query parameters
 * @returns Promise with API result
 */
export async function callJiraApi<T>(
  config: AtlassianConfig,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data: any = null,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    const client = getJiraClient(config);
    logger.debug(`Calling Jira API with jira.js: ${method} ${endpoint}`);
    // This is a generic helper, needs specific implementation for each API endpoint
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      "This API call method is not implemented with jira.js. Please use specific methods.",
      501
    );
  } catch (error: any) {
    logger.error(`Jira API error with jira.js:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    const statusCode = error.response?.status || 500;
    const errorMessage = error.message || "Unknown error";
    if (statusCode === 400) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        "Invalid request",
        statusCode,
        error
      );
    } else if (statusCode === 401) {
      throw new ApiError(
        ApiErrorType.AUTHENTICATION_ERROR,
        "Unauthorized. Check your credentials.",
        statusCode,
        error
      );
    } else if (statusCode === 403) {
      throw new ApiError(
        ApiErrorType.AUTHORIZATION_ERROR,
        "No permission to access the resource",
        statusCode,
        error
      );
    } else if (statusCode === 404) {
      throw new ApiError(
        ApiErrorType.NOT_FOUND_ERROR,
        "Resource not found",
        statusCode,
        error
      );
    } else if (statusCode === 429) {
      throw new ApiError(
        ApiErrorType.RATE_LIMIT_ERROR,
        "API rate limit exceeded",
        statusCode,
        error
      );
    } else {
      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        `Jira API error: ${errorMessage}`,
        statusCode,
        error
      );
    }
  }
}

/**
 * Call Confluence API using fetch with proper User-Agent
 * @param config Atlassian config (baseUrl, apiToken, email)
 * @param endpoint API endpoint path
 * @param method HTTP method (GET, POST, PUT, DELETE)
 * @param data Request body
 * @param params Query parameters
 * @returns Promise with API result
 */
export async function callConfluenceApi<T>(
  config: AtlassianConfig,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data: any = null,
  params: Record<string, any> = {}
): Promise<T> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    // Normalize baseUrl
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith("http://")) {
      baseUrl = baseUrl.replace("http://", "https://");
    } else if (!baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    // Ensure .atlassian.net in URL
    if (!baseUrl.includes(".atlassian.net")) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    // Handle duplicate .atlassian.net
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace(
        ".atlassian.net.atlassian.net",
        ".atlassian.net"
      );
    }
    // API URL as per docs
    let url = `${baseUrl}/wiki${endpoint}`;
    // Add params to URL if any
    if (params && Object.keys(params).length > 0) {
      const queryParams = new URLSearchParams();
      Object.entries(params).forEach(([key, value]) => {
        queryParams.append(key, String(value));
      });
      url += `?${queryParams.toString()}`;
    }
    logger.debug(`Calling Confluence API: ${method} ${url}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    logger.debug(`Token length: ${config.apiToken?.length || 0} characters`);
    logger.debug(
      "Full request headers:",
      JSON.stringify(
        headers,
        (key, value) => (key === "Authorization" ? "Basic ***" : value),
        2
      )
    );
    const curlCmd = `curl -X ${method} -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}"${
      data && (method === "POST" || method === "PUT")
        ? ` -d '${JSON.stringify(data)}'`
        : ""
    }`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const fetchOptions: RequestInit = {
      method,
      headers,
      credentials: "omit",
    };
    if (data && (method === "POST" || method === "PUT")) {
      fetchOptions.body = JSON.stringify(data);
    }
    logger.debug("Fetch options:", {
      ...fetchOptions,
      headers: { ...headers, Authorization: "Basic ***" },
    });
    const response = await fetch(url, fetchOptions);
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid request",
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
          "No permission to access the resource",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          "Resource not found",
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
          `Confluence API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }
    // Nếu là DELETE và không có content, chỉ trả về true
    if (method === 'DELETE') {
      const text = await response.text();
      if (!text) return true as any;
      try {
        return JSON.parse(text) as T;
      } catch {
        return true as any;
      }
    }
    const responseData = await response.json();
    return responseData as T;
  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error("Unhandled error in Confluence API call:", error);
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Unknown error: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500
    );
  }
}

/**
 * Get information about an issue
 * @param config Atlassian config
 * @param issueIdOrKey Issue ID or key
 * @returns Issue information
 */
export async function getIssue(
  config: AtlassianConfig,
  issueIdOrKey: string
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith("http://")) {
      baseUrl = baseUrl.replace("http://", "https://");
    } else if (!baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl.includes(".atlassian.net")) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace(
        ".atlassian.net.atlassian.net",
        ".atlassian.net"
      );
    }
    const url = `${baseUrl}/rest/api/3/issue/${issueIdOrKey}?expand=renderedFields,names,schema,operations`;
    logger.debug(`Getting issue with direct fetch: ${url}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    const curlCmd = `curl -X GET -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}"`;
    logger.info(`Debug with curl: ${curlCmd}`);
    const response = await fetch(url, {
      method: "GET",
      headers,
      credentials: "omit",
    });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Invalid request",
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
          "No permission to access the resource",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Issue ${issueIdOrKey} not found`,
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
    const issue = await response.json();
    return issue;
  } catch (error: any) {
    logger.error(`Error getting issue ${issueIdOrKey}:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error getting issue: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Search issues by JQL
 * @param config Atlassian config
 * @param jql JQL query string
 * @param maxResults Maximum number of results
 * @returns List of issues
 */
export async function searchIssues(
  config: AtlassianConfig,
  jql: string,
  maxResults: number = 50
): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    // Normalize baseUrl
    let baseUrl = config.baseUrl;
    if (baseUrl.startsWith("http://")) {
      baseUrl = baseUrl.replace("http://", "https://");
    } else if (!baseUrl.startsWith("https://")) {
      baseUrl = `https://${baseUrl}`;
    }
    // Ensure .atlassian.net in URL
    if (!baseUrl.includes(".atlassian.net")) {
      baseUrl = `${baseUrl}.atlassian.net`;
    }
    // Handle duplicate .atlassian.net
    if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
      baseUrl = baseUrl.replace(
        ".atlassian.net.atlassian.net",
        ".atlassian.net"
      );
    }
    // API URL for Jira search
    const url = `${baseUrl}/rest/api/3/search`;
    logger.debug(`Searching issues with JQL: ${jql}`);
    logger.debug(`With Auth: ${config.email}:*****`);
    // Data for request
    const data = {
      jql,
      maxResults,
      expand: ["names", "schema", "operations"],
    };
    // Debug curl command
    const curlCmd = `curl -X POST -H "Content-Type: application/json" -H "Accept: application/json" -H "User-Agent: MCP-Atlassian-Server/1.0.0" -u "${
      config.email
    }:${config.apiToken.substring(0, 5)}..." "${url}" -d '${JSON.stringify(
      data
    )}'`;
    logger.info(`Debug with curl: ${curlCmd}`);
    // Fetch
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
          "Invalid JQL or request",
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
          "No permission to search issues",
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
    const searchResults = await response.json();
    return searchResults;
  } catch (error: any) {
    logger.error(`Error searching issues:`, error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error searching issues: ${
        error instanceof Error ? error.message : String(error)
      }`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Normalize baseUrl for Atlassian API
 * @param baseUrl Base URL to normalize
 * @returns Normalized URL
 */
export function normalizeAtlassianBaseUrl(baseUrl: string): string {
  let normalizedUrl = baseUrl;
  if (normalizedUrl.startsWith("http://")) {
    normalizedUrl = normalizedUrl.replace("http://", "https://");
  } else if (!normalizedUrl.startsWith("https://")) {
    normalizedUrl = `https://${normalizedUrl}`;
  }
  if (!normalizedUrl.includes(".atlassian.net")) {
    normalizedUrl = `${normalizedUrl}.atlassian.net`;
  }
  if (normalizedUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
    normalizedUrl = normalizedUrl.replace(
      ".atlassian.net.atlassian.net",
      ".atlassian.net"
    );
  }
  return normalizedUrl;
}

/**
 * Create a new issue
 * @param config Atlassian config
 * @param projectKey Project key
 * @param summary Issue summary
 * @param description Issue description (optional)
 * @param issueType Issue type (default is "Task")
 * @param additionalFields Additional fields (optional)
 * @returns Information about the created issue
 */
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

/**
 * Update issue information
 * @param config Atlassian config
 * @param issueIdOrKey ID or key of the issue to update
 * @param fields Fields to update
 * @returns Update result
 */
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

/**
 * Transition issue status
 * @param config Atlassian config
 * @param issueIdOrKey ID or key of the issue
 * @param transitionId ID of the status to transition to
 * @param comment Comment to add (optional)
 * @returns Transition result
 */
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

/**
 * Assign issue to user
 * @param config Atlassian config
 * @param issueIdOrKey ID or key of the issue
 * @param accountId ID of the account to assign (null to unassign)
 * @returns Assign issue result
 */
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
 * Convert Atlassian Document Format to simple Markdown
 * @param content ADF content
 * @returns Markdown string
 */
export function adfToMarkdown(content: any): string {
  if (!content || !content.content) return "";
  let markdown = "";
  const processNode = (node: any): string => {
    if (!node) return "";
    switch (node.type) {
      case "paragraph":
        return node.content
          ? node.content.map(processNode).join("") + "\n\n"
          : "\n\n";
      case "text":
        let text = node.text || "";
        if (node.marks) {
          node.marks.forEach((mark: any) => {
            switch (mark.type) {
              case "strong":
                text = `**${text}**`;
                break;
              case "em":
                text = `*${text}*`;
                break;
              case "code":
                text = `\`${text}\``;
                break;
              case "link":
                text = `[${text}](${mark.attrs.href})`;
                break;
            }
          });
        }
        return text;
      case "heading":
        const level = node.attrs.level;
        const headingContent = node.content
          ? node.content.map(processNode).join("")
          : "";
        return "#".repeat(level) + " " + headingContent + "\n\n";
      case "bulletList":
        return node.content ? node.content.map(processNode).join("") : "";
      case "listItem":
        return (
          "- " +
          (node.content ? node.content.map(processNode).join("") : "") +
          "\n"
        );
      case "orderedList":
        return node.content
          ? node.content
              .map((item: any, index: number) => {
                return `${index + 1}. ${processNode(item)}`;
              })
              .join("")
          : "";
      case "codeBlock":
        const code = node.content ? node.content.map(processNode).join("") : "";
        const language =
          node.attrs && node.attrs.language ? node.attrs.language : "";
        return `\
                \
                \
                ${language}\n${code}\n\
                \
                \
                `;
      default:
        return node.content ? node.content.map(processNode).join("") : "";
    }
  };
  content.content.forEach((node: any) => {
    markdown += processNode(node);
  });
  return markdown;
}

/**
 * Get list of Jira filters (with pagination)
 */
export async function getFilters(config: AtlassianConfig, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter/search?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira filters: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get Jira filter by ID
 */
export async function getFilterById(config: AtlassianConfig, filterId: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
  logger.debug(`GET Jira filter by ID: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get filters owned by or shared with the current user
 */
export async function getMyFilters(config: AtlassianConfig): Promise<any[]> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter/my`;
  logger.debug(`GET Jira my filters: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get list of Jira boards (Agile)
 */
export async function getBoards(config: AtlassianConfig, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/board?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira boards: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get Jira board by ID (Agile)
 */
export async function getBoardById(config: AtlassianConfig, boardId: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/board/${boardId}`;
  logger.debug(`GET Jira board by ID: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get issues in a Jira board (Agile)
 */
export async function getBoardIssues(config: AtlassianConfig, boardId: string, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/issue?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira board issues: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get list of sprints in a Jira board (Agile)
 */
export async function getSprintsByBoard(config: AtlassianConfig, boardId: string, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/sprint?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira sprints by board: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get Jira sprint by ID (Agile)
 */
export async function getSprintById(config: AtlassianConfig, sprintId: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
  logger.debug(`GET Jira sprint by ID: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get issues in a Jira sprint (Agile)
 */
export async function getSprintIssues(config: AtlassianConfig, sprintId: string, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira sprint issues: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get labels of a Confluence page (API v2, cursor-based)
 */
export async function getConfluencePageLabelsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/labels`,
    'GET',
    null,
    params
  );
}

/**
 * Get attachments of a Confluence page (API v2, cursor-based)
 */
export async function getConfluencePageAttachmentsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/attachments`,
    'GET',
    null,
    params
  );
}

/**
 * Get versions of a Confluence page (API v2, cursor-based)
 */
export async function getConfluencePageVersionsV2(config: AtlassianConfig, pageId: string, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/versions`,
    'GET',
    null,
    params
  );
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
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter`;
  const data: any = {
    name,
    jql,
    description: description || '',
    favourite: favourite !== undefined ? favourite : false
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Update an existing Jira filter
 */
export async function updateFilter(
  config: AtlassianConfig,
  filterId: string,
  updateData: { name?: string; jql?: string; description?: string; favourite?: boolean }
): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
  // Lấy filter hiện tại để merge (API yêu cầu PUT phải đủ trường)
  const current = await (async () => {
    const res = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!res.ok) throw new Error(`Jira API error: ${res.status} ${await res.text()}`);
    return await res.json();
  })();
  const data = { ...current, ...updateData };
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Delete a Jira filter
 */
export async function deleteFilter(
  config: AtlassianConfig,
  filterId: string
): Promise<void> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/filter/${filterId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
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
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint`;
  const data: any = {
    name,
    originBoardId: boardId
  };
  if (startDate) data.startDate = startDate;
  if (endDate) data.endDate = endDate;
  if (goal) data.goal = goal;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get list of Jira dashboards (all)
 */
export async function getDashboards(config: AtlassianConfig, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard?startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira dashboards: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get list of Jira dashboards owned by current user (my dashboards)
 */
export async function getMyDashboards(config: AtlassianConfig, startAt = 0, maxResults = 50): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  // Atlassian API: filter=my
  const url = `${baseUrl}/rest/api/3/dashboard/search?filter=my&startAt=${startAt}&maxResults=${maxResults}`;
  logger.debug(`GET Jira my dashboards: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get Jira dashboard by ID
 */
export async function getDashboardById(config: AtlassianConfig, dashboardId: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}`;
  logger.debug(`GET Jira dashboard by ID: ${url}`);
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get gadgets (widgets) of a Jira dashboard
 */
export async function getDashboardGadgets(config: AtlassianConfig, dashboardId: string): Promise<any> {
  // Gadgets nằm trong trường gadgets của dashboard details
  const dashboard = await getDashboardById(config, dashboardId);
  return dashboard.gadgets || [];
}

/**
 * Add issue(s) to a Jira board (scrum backlog)
 * Endpoint: POST /rest/agile/1.0/backlog/issue
 * Payload: { issues: [issueKey] }
 */
export async function addIssueToBoard(config: AtlassianConfig, boardId: string, issueKey: string | string[]): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
  const issues = Array.isArray(issueKey) ? issueKey : [issueKey];
  const data = { issues };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Configure board columns
 * Endpoint: PUT /rest/agile/1.0/board/{boardId}/configuration
 * Payload: { ...boardConfig, columnConfig: { columns: [...] } }
 */
export async function configureBoardColumns(config: AtlassianConfig, boardId: string, columns: any[]): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/board/${boardId}/configuration`;
  // Lấy config hiện tại để merge
  const currentRes = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!currentRes.ok) throw new Error(`Jira API error: ${currentRes.status} ${await currentRes.text()}`);
  const currentConfig = await currentRes.json();
  const data = { ...currentConfig, columnConfig: { columns } };
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Start a Jira sprint
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}
 * Payload: { state: 'active', startDate, endDate, goal }
 */
export async function startSprint(config: AtlassianConfig, sprintId: string, startDate: string, endDate: string, goal?: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
  const data: any = {
    state: 'active',
    startDate,
    endDate
  };
  if (goal) data.goal = goal;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Close a Jira sprint
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}
 * Payload: { state: 'closed', completeDate, moveToSprintId?, createNewSprint? }
 */
export async function closeSprint(config: AtlassianConfig, sprintId: string, options: { completeDate?: string, moveToSprintId?: string, createNewSprint?: boolean } = {}): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}`;
  const data: any = {
    state: 'closed',
    ...options
  };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Move issues between sprints
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}/issue
 * Payload: { issues: [issueKey], remove?: true }
 */
export async function moveIssuesBetweenSprints(config: AtlassianConfig, fromSprintId: string, toSprintId: string, issueKeys: string[]): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  // Remove from old sprint
  const removeUrl = `${baseUrl}/rest/agile/1.0/sprint/${fromSprintId}/issue`;
  await fetch(removeUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ issues: issueKeys, remove: true }),
    credentials: 'omit',
  });
  // Add to new sprint
  const addUrl = `${baseUrl}/rest/agile/1.0/sprint/${toSprintId}/issue`;
  const response = await fetch(addUrl, {
    method: 'POST',
    headers,
    body: JSON.stringify({ issues: issueKeys }),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Add issues to backlog
 * Endpoint: POST /rest/agile/1.0/backlog/issue
 * Payload: { issues: [issueKey] }
 */
export async function addIssuesToBacklog(config: AtlassianConfig, boardId: string, issueKeys: string[]): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/backlog/issue`;
  const data = { issues: issueKeys };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Remove issues from backlog (move to sprint)
 * Endpoint: POST /rest/agile/1.0/sprint/{sprintId}/issue
 * Payload: { issues: [issueKey] }
 */
export async function removeIssuesFromBacklog(config: AtlassianConfig, boardId: string, sprintId: string, issueKeys: string[]): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/sprint/${sprintId}/issue`;
  const data = { issues: issueKeys };
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Rank backlog issues
 * Endpoint: PUT /rest/agile/1.0/issue/rank
 * Payload: { issues: [issueKey], rankBeforeIssue?, rankAfterIssue? }
 */
export async function rankBacklogIssues(config: AtlassianConfig, boardId: string, issueKeys: string[], options: { rankBeforeIssue?: string, rankAfterIssue?: string } = {}): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/agile/1.0/issue/rank`;
  const data: any = { issues: issueKeys };
  if (options.rankBeforeIssue) data.rankBeforeIssue = options.rankBeforeIssue;
  if (options.rankAfterIssue) data.rankAfterIssue = options.rankAfterIssue;
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Create a new Jira dashboard
 * Endpoint: POST /rest/api/3/dashboard
 * Payload: { name, description, sharePermissions }
 */
export async function createDashboard(config: AtlassianConfig, data: { name: string, description?: string, sharePermissions?: any[] }): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Update a Jira dashboard
 * Endpoint: PUT /rest/api/3/dashboard/{dashboardId}
 * Payload: { name?, description?, sharePermissions? }
 */
export async function updateDashboard(config: AtlassianConfig, dashboardId: string, data: { name?: string, description?: string, sharePermissions?: any[] }): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}`;
  const response = await fetch(url, {
    method: 'PUT',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Add gadget to dashboard
 * Endpoint: POST /rest/api/3/dashboard/{dashboardId}/gadget
 * Payload: { uri, color, position, title, properties? }
 */
export async function addGadgetToDashboard(config: AtlassianConfig, dashboardId: string, data: { uri: string, color?: string, position?: any, title?: string, properties?: any }): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}/gadget`;
  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(data),
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Remove gadget from dashboard
 * Endpoint: DELETE /rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}
 */
export async function removeGadgetFromDashboard(config: AtlassianConfig, dashboardId: string, gadgetId: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  let baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/dashboard/${dashboardId}/gadget/${gadgetId}`;
  const response = await fetch(url, {
    method: 'DELETE',
    headers,
    credentials: 'omit',
  });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return { success: true };
}

/**
 * Get list of Confluence pages (API v2, cursor-based)
 */
export async function getConfluencePagesV2(config: AtlassianConfig, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages`,
    'GET',
    null,
    params
  );
}

/**
 * Get Confluence page details (API v2, metadata only)
 */
export async function getConfluencePageV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}`,
    'GET'
  );
}

/**
 * Get Confluence page body (API v2)
 */
export async function getConfluencePageBodyV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/body`,
    'GET'
  );
}

/**
 * Get Confluence page ancestors (API v2)
 */
export async function getConfluencePageAncestorsV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/ancestors`,
    'GET'
  );
}

/**
 * Get list of Confluence spaces (API v2, cursor-based)
 */
export async function getConfluenceSpacesV2(config: AtlassianConfig, cursor?: string, limit: number = 25): Promise<any> {
  const params: Record<string, any> = { limit };
  if (cursor) params.cursor = cursor;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/spaces`,
    'GET',
    null,
    params
  );
}

/**
 * Get Confluence space details (API v2)
 */
export async function getConfluenceSpaceV2(config: AtlassianConfig, spaceKey: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/spaces/${encodeURIComponent(spaceKey)}`,
    'GET'
  );
}

/**
 * Create a new Confluence page (API v2)
 */
export async function createConfluencePageV2(config: AtlassianConfig, params: { spaceId: string, title: string, content: string, parentId?: string }): Promise<any> {
  // Validate content
  if (!params.content.trim().startsWith('<')) {
    throw new Error('Content must be in Confluence storage format (XML-like HTML).');
  }
  // Chuẩn bị payload
  const requestData: any = {
    spaceId: params.spaceId,
    title: params.title,
    body: {
      representation: 'storage',
      value: params.content
    }
  };
  if (params.parentId) requestData.parentId = params.parentId;
  // Gọi API tạo page
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages`,
    'POST',
    requestData
  );
}

/**
 * Update a Confluence page (API v2)
 * Có thể update title hoặc body hoặc cả hai. Mỗi lần update phải tăng version.
 */
export async function updateConfluencePageV2(config: AtlassianConfig, params: { pageId: string, title: string, content: string, version: number }): Promise<any> {
  const payload = {
    id: params.pageId,
    status: "current",
    title: params.title,
    body: {
      representation: "storage",
      value: params.content
    },
    version: {
      number: params.version
    }
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(params.pageId)}`,
    'PUT',
    payload
  );
}

/**
 * Add a comment to a Confluence page (API v2)
 */
export async function addConfluenceCommentV2(config: AtlassianConfig, params: { pageId: string, content: string }): Promise<any> {
  if (!params.content.trim().startsWith('<')) {
    throw new Error('Comment content must be in Confluence storage format (XML-like HTML).');
  }
  const requestData = {
    pageId: params.pageId,
    body: {
      representation: 'storage',
      value: params.content
    }
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments`,
    'POST',
    requestData
  );
}

/**
 * Get list of Jira projects (API v3)
 */
export async function getProjects(config: AtlassianConfig): Promise<any[]> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/project`;
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get Jira project details (API v3)
 */
export async function getProject(config: AtlassianConfig, projectKey: string): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const url = `${baseUrl}/rest/api/3/project/${projectKey}`;
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
  if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  return await response.json();
}

/**
 * Get children of a Confluence page (API v2)
 */
export async function getConfluencePageChildrenV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/children`,
    'GET'
  );
}

/**
 * Get comments of a Confluence page (API v2)
 */
export async function getConfluencePageCommentsV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/comments`,
    'GET'
  );
}

/**
 * Search Confluence pages by CQL (API v2)
 */
export async function searchConfluencePagesByCqlV2(config: AtlassianConfig, cql: string, start: number = 0, limit: number = 20): Promise<any> {
  const params: Record<string, any> = { cql, start, limit };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/search`,
    'GET',
    null,
    params
  );
}

/**
 * Get footer comments of a Confluence page (API v2)
 */
export async function getConfluencePageFooterCommentsV2(config: AtlassianConfig, pageId: string, params: { limit?: number, cursor?: string } = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/footer-comments`,
    'GET',
    null,
    params
  );
}

/**
 * Get inline comments of a Confluence page (API v2)
 */
export async function getConfluencePageInlineCommentsV2(config: AtlassianConfig, pageId: string, params: { limit?: number, cursor?: string } = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(pageId)}/inline-comments`,
    'GET',
    null,
    params
  );
}

/**
 * Get list of Confluence pages (API v2, hỗ trợ filter nâng cao)
 * @param config AtlassianConfig
 * @param filters object chứa các filter hợp lệ v2 (space-id, label, status, title, body-format, sort, cursor, limit)
 */
export async function getConfluencePagesWithFilters(config: AtlassianConfig, filters: Record<string, any> = {}): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    '/api/v2/pages',
    'GET',
    null,
    filters
  );
}

/**
 * Delete a Confluence page (API v2)
 * @param config AtlassianConfig
 * @param params object containing pageId, draft, and purge
 */
export async function deleteConfluencePageV2(config: AtlassianConfig, params: { pageId: string, draft?: boolean, purge?: boolean }): Promise<any> {
  const query: string[] = [];
  if (params.draft) query.push('draft=true');
  if (params.purge) query.push('purge=true');
  const endpoint = `/api/v2/pages/${encodeURIComponent(params.pageId)}` + (query.length ? `?${query.join('&')}` : '');
  return await callConfluenceApi<any>(
    config,
    endpoint,
    'DELETE'
  );
}

/**
 * Update Confluence page title (API v2)
 * @param config AtlassianConfig
 * @param params object containing pageId, title, and version
 */
export async function updateConfluencePageTitleV2(config: AtlassianConfig, params: { pageId: string, title: string, version: number }): Promise<any> {
  const payload = {
    title: params.title,
    version: { number: params.version },
    status: "current"
  };
  return await callConfluenceApi<any>(
    config,
    `/api/v2/pages/${encodeURIComponent(params.pageId)}/title`,
    'PUT',
    payload
  );
}

/**
 * Update a footer comment in Confluence (API v2)
 * @param config AtlassianConfig
 * @param params object chứa commentId, version, body, message (tùy chọn)
 */
export async function updateConfluenceFooterCommentV2(config: AtlassianConfig, params: { commentId: string|number, version: number, value: string, representation?: string, message?: string }): Promise<any> {
  const payload: any = {
    version: {
      number: params.version
    },
    body: {
      representation: params.representation || 'storage',
      value: params.value
    }
  };
  if (params.message) payload.version.message = params.message;
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments/${encodeURIComponent(params.commentId)}`,
    'PUT',
    payload
  );
}

/**
 * Delete a footer comment in Confluence (API v2)
 * @param config AtlassianConfig
 * @param commentId ID của comment cần xóa
 */
export async function deleteConfluenceFooterCommentV2(config: AtlassianConfig, commentId: string|number): Promise<any> {
  return await callConfluenceApi<any>(
    config,
    `/api/v2/footer-comments/${encodeURIComponent(commentId)}`,
    'DELETE'
  );
}
