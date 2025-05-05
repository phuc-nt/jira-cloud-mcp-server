import { Version3Client, Version3Models } from "jira.js";
import { ApiError, ApiErrorType } from "./error-handler.js";
import { Logger } from "./logger.js";
import fetch from "cross-fetch";

/**
 * Utilities for calling Atlassian APIs (Jira, Confluence)
 */

export interface AtlassianConfig {
  baseUrl: string;
  apiToken: string;
  email: string;
}

// Initialize logger
const logger = Logger.getLogger("AtlassianAPI");

// Cache for Atlassian clients to reuse
const clientCache = new Map<string, Version3Client>();

/**
 * Create basic headers for API request
 * @param email User email
 * @param apiToken User API token
 * @returns Object containing basic headers
 */
const createBasicHeaders = (email: string, apiToken: string) => {
  // Remove whitespace and newlines from API token
  const cleanedToken = apiToken.replace(/\s+/g, "");
  // Always use Basic Authentication as per API docs
  const auth = Buffer.from(`${email}:${cleanedToken}`).toString("base64");
  // Log headers for debugging
  logger.debug(
    "Creating headers with User-Agent:",
    "MCP-Atlassian-Server/1.0.0"
  );
  return {
    Authorization: `Basic ${auth}`,
    "Content-Type": "application/json",
    Accept: "application/json",
    // Add User-Agent to help Cloudfront identify the request
    "User-Agent": "MCP-Atlassian-Server/1.0.0",
  };
};

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
    let url = `${baseUrl}/wiki/rest/api${endpoint}`;
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
