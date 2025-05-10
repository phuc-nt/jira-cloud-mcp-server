import { Version3Client } from "jira.js";
import { Logger } from "./logger.js";

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