/**
 * Core interfaces and functions for MCP responses
 * This module provides the foundation for all MCP responses
 */

/**
 * Standard MCP response interface
 */
export interface McpResponse<T = any> {
  contents: Array<McpContent>;
  isError?: boolean;
  data?: T;
  [key: string]: unknown;
}

/**
 * MCP content types
 */
export type McpContent = 
  { uri: string; mimeType: string; text: string; [key: string]: unknown }
  | { uri: string; mimeType: string; blob: string; [key: string]: unknown };

/**
 * Create a standard response with JSON content
 */
export function createJsonResponse<T>(uri: string, data: T, mimeType = 'application/json'): McpResponse<T> {
  return {
    contents: [
      {
        uri,
        mimeType,
        text: JSON.stringify(data)
      }
    ],
    data
  };
}

/**
 * Create a standard success response
 */
export function createSuccessResponse(uri: string, message: string, data?: any): McpResponse {
  return createJsonResponse(uri, {
    success: true,
    message,
    ...(data && { data })
  });
}

/**
 * Create a standard error response
 */
export function createErrorResponse(uri: string, message: string, details?: any): McpResponse {
  return {
    contents: [
      {
        uri,
        mimeType: 'application/json',
        text: JSON.stringify({
          success: false,
          message,
          ...(details && { details })
        })
      }
    ],
    isError: true
  };
} 