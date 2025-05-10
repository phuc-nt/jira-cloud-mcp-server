import { Version3Client } from "jira.js";
import { Logger } from "./logger.js";
import { ApiError, ApiErrorType } from "./error-handler.js";
import fetch from "cross-fetch";

export interface AtlassianConfig {
  baseUrl: string;
  apiToken: string;
  email: string;
}

// Initialize logger
export const logger = Logger.getLogger("AtlassianAPI");

// Cache for Atlassian clients to reuse
export const clientCache = new Map<string, Version3Client>();

/**
 * Create basic headers for API request
 * @param email User email
 * @param apiToken User API token
 * @returns Object containing basic headers
 */
export const createBasicHeaders = (email: string, apiToken: string) => {
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

// Helper: Create or get Jira client from cache
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
  if (!baseUrl.includes(".atlassian.net")) {
    baseUrl = `${baseUrl}.atlassian.net`;
  }
  if (baseUrl.match(/\.atlassian\.net\.atlassian\.net/)) {
    baseUrl = baseUrl.replace(".atlassian.net.atlassian.net", ".atlassian.net");
  }
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
  clientCache.set(cacheKey, client);
  return client;
}

// Helper: Normalize baseUrl for Atlassian API
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

// Helper: Call Jira API using jira.js (throw by default)
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
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Jira API error: ${errorMessage}`,
      statusCode,
      error
    );
  }
}

// Helper: Call Confluence API using fetch
export async function callConfluenceApi<T>(
  config: AtlassianConfig,
  endpoint: string,
  method: "GET" | "POST" | "PUT" | "DELETE" = "GET",
  data: any = null,
  params: Record<string, any> = {}
): Promise<T> {
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
    let url = `${baseUrl}/wiki${endpoint}`;
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
    }:${config.apiToken.substring(0, 5)}..." "${url}"$${
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
      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        `Confluence API error: ${responseText}`,
        statusCode,
        new Error(responseText)
      );
    }
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

// Helper: Convert Atlassian Document Format to simple Markdown
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
        return `
                
                
                ${language}\n${code}\n
                
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