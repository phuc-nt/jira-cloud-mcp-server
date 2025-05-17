import { ApiError, ApiErrorType } from './error-handler.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('ToolHelpers');

/**
 * Create a standardized response for MCP tools
 * @param success Whether the operation was successful
 * @param message Optional message to include in the response
 * @param data Optional data to include in the response
 * @returns Standardized response object
 */
export function createToolResponse(success: boolean, message?: string, data?: any) {
  const response = {
    success,
    ...(message && { message }),
    ...(data && { data })
  };

  return {
    content: [
      {
        mimeType: 'application/json',
        text: JSON.stringify(response)
      }
    ]
  };
}

/**
 * Create a simple tool response with text content
 * @deprecated Use createToolResponse(true, message) instead
 * @param text Response text
 * @returns Tool response object
 */
export function createSimpleToolResponse(text: string) {
  return {
    content: [{ type: 'text', text }]
  };
}

/**
 * Create an error response
 * @deprecated Use createToolResponse(false, errorMessage) instead
 * @param error Error or error message
 * @returns Error response object
 */
export function createErrorResponse(error: Error | string) {
  const message = error instanceof Error ? error.message : error;
  return {
    content: [{ type: 'text', text: `Error: ${message}` }],
    isError: true
  };
}

/**
 * Higher-order function to wrap a tool implementation with standardized error handling
 * @param toolName Name of the tool for logging
 * @param handler The tool implementation function
 * @returns Wrapped function with error handling
 */
export function wrapToolWithErrorHandling<T, P>(
  toolName: string,
  handler: (params: P) => Promise<T>
): (params: P) => Promise<any> {
  return async (params: P) => {
    try {
      // Execute the handler
      const result = await handler(params);
      
      // Return successful response with data
      return createToolResponse(true, `${toolName} executed successfully`, result);
    } catch (error) {
      // Log the error
      logger.error(`Error executing tool ${toolName}:`, error);
      
      // Create appropriate error message
      let errorMessage: string;
      let errorType = ApiErrorType.UNKNOWN_ERROR;
      let statusCode = 500;
      
      if (error instanceof ApiError) {
        errorMessage = error.message;
        errorType = error.type;
        statusCode = error.statusCode;
      } else {
        errorMessage = error instanceof Error ? error.message : String(error);
      }
      
      // Return standardized error response
      return createToolResponse(false, errorMessage);
    }
  };
}

/**
 * Register a tool with the MCP server
 * @param server MCP Server instance
 * @param name Tool name
 * @param schema Tool schema
 * @param handler Tool handler function
 */
export function registerTool(
  server: any,
  name: string,
  schema: any,
  handler: (params: any, context: any) => Promise<any>
) {
  logger.info(`Registering tool: ${name}`);
  server.tool(name, schema, async (params: any, context: any) => {
    try {
      logger.debug(`Executing tool ${name} with params:`, params);
      const result = await handler(params, context);
      logger.debug(`Tool ${name} executed successfully`);
      return result;
    } catch (error: any) {
      logger.error(`Error in tool ${name}:`, error);
      return createErrorResponse(error as Error | string);
    }
  });
}
