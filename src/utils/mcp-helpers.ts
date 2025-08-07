/**
 * Core MCP utilities and helper functions
 * Consolidated from mcp-core.ts for simplified architecture
 */
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { ApiError, ApiErrorType } from './error-handler.js';
import { AtlassianConfig } from './atlassian-api-base.js';
import { Logger } from './logger.js';
import { StandardMetadata, createStandardMetadata } from '../schemas/common.js';

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

const logger = Logger.getLogger('MCPHelpers');

/**
 * Environment and configuration utilities
 */
export namespace Config {
  /**
   * Get Atlassian configuration from environment variables
   */
  export function getAtlassianConfigFromEnv(): AtlassianConfig {
    const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
    const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
    const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

    if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
      logger.error('Missing Atlassian credentials in environment variables');
      throw new Error('Missing Atlassian credentials in environment variables');
    }

    return {
      baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
        ? `https://${ATLASSIAN_SITE_NAME}` 
        : ATLASSIAN_SITE_NAME,
      email: ATLASSIAN_USER_EMAIL,
      apiToken: ATLASSIAN_API_TOKEN
    };
  }

  /**
   * Helper to get Atlassian config from context or environment
   */
  export function getConfigFromContextOrEnv(context: any): AtlassianConfig {
    if (context?.atlassianConfig) {
      return context.atlassianConfig;
    }
    return getAtlassianConfigFromEnv();
  }
}


/**
 * Tool helper functions
 */
export namespace Tools {
  /**
   * Standardized response structure for MCP tools
   */
  export interface ToolResponse<T = any> {
    contents: Array<{
      mimeType: string;
      text: string;
    }>;
    isError?: boolean;
  }

  /**
   * Create a standardized response for MCP tools
   */
  export function createToolResponse<T = any>(success: boolean, message?: string, data?: T): ToolResponse<T> {
    const response = {
      success,
      ...(message && { message }),
      ...(data && { data })
    };
    return {
      contents: [
        {
          mimeType: 'application/json',
          text: JSON.stringify(response)
        }
      ]
    };
  }

  /**
   * Higher-order function to wrap a tool implementation with standardized error handling
   */
  export function wrapWithErrorHandling<T, P>(
    toolName: string,
    handler: (params: P) => Promise<T>
  ): (params: P) => Promise<ToolResponse<T>> {
    return async (params: P): Promise<ToolResponse<T>> => {
      try {
        // Execute the handler
        const result = await handler(params);
        // Return successful response with data
        return createToolResponse<T>(true, `${toolName} executed successfully`, result);
      } catch (error) {
        // Log the error
        logger.error(`Error executing tool ${toolName}:`, error);
        // Create appropriate error message
        let errorMessage: string;
        if (error instanceof ApiError) {
          errorMessage = error.message;
        } else {
          errorMessage = error instanceof Error ? error.message : String(error);
        }
        // Return standardized error response
        return createToolResponse(false, errorMessage);
      }
    };
  }
} 