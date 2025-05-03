/**
 * Utilities for creating standard MCP Protocol responses
 */

export interface McpResponse {
  content: Array<McpContent>;
  [key: string]: unknown;
  _meta?: Record<string, unknown>;
  isError?: boolean;
}

export type McpContent = 
  | { type: "text"; text: string; [key: string]: unknown }
  | { type: "image"; data: string; mimeType: string; [key: string]: unknown }
  | { type: "audio"; data: string; mimeType: string; [key: string]: unknown }
  | { 
      type: "resource"; 
      resource: 
        | { text: string; uri: string; mimeType?: string; [key: string]: unknown }
        | { uri: string; blob: string; mimeType?: string; [key: string]: unknown }
    };

/**
 * Create a standard MCP text response
 * @param text Text content
 * @param additionalProps Additional properties (optional)
 * @returns Standard MCP response object
 */
export function createTextResponse(text: string, additionalProps: Record<string, unknown> = {}): McpResponse {
  return {
    ...additionalProps,
    content: [
      { type: "text", text }
    ]
  };
}

/**
 * Convert a result to a standard MCP text response
 * @param result Result to convert
 * @returns Standard MCP response object
 */
export function createResponseFromResult(result: unknown): McpResponse {
  // If result is null or undefined
  if (result === null || result === undefined) {
    return createTextResponse("No result");
  }

  // If result is already an McpResponse
  if (typeof result === 'object' && result !== null && 'content' in result) {
    return result as McpResponse;
  }

  // If result is an object
  if (typeof result === 'object') {
    const resultStr = JSON.stringify(result, null, 2);
    return createTextResponse(resultStr, result as Record<string, unknown>);
  }

  // If result is a primitive type
  return createTextResponse(String(result));
}

/**
 * Create a standard MCP error response
 * @param errorMessage Error message
 * @param additionalProps Additional properties (optional)
 * @returns Standard MCP error response object
 */
export function createErrorResponse(errorMessage: string, additionalProps: Record<string, unknown> = {}): McpResponse {
  return {
    ...additionalProps,
    isError: true,
    content: [
      { type: "text", text: errorMessage }
    ]
  };
} 