import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:addComment');

// Input parameter schema
export const addCommentSchema = z.object({
  pageId: z.string().describe('ID of the page to add a comment to'),
  content: z.string().describe('Content of the comment (in Confluence storage/HTML format)')
});

type AddCommentParams = z.infer<typeof addCommentSchema>;

interface AddCommentResult {
  commentId: string;
  status: string;
}

// Main handler to add a comment to a page
export async function addCommentHandler(
  params: AddCommentParams,
  config: AtlassianConfig
): Promise<AddCommentResult> {
  try {
    logger.info(`Adding comment to page: ${params.pageId}`);
    
    // Prepare data for API call
    const requestData = {
      type: 'comment',
      container: {
        type: 'page',
        id: params.pageId
      },
      body: {
        storage: {
          value: params.content,
          representation: 'storage'
        }
      }
    };
    
    // Call Confluence API to add comment
    const response = await callConfluenceApi<any>(
      config,
      '/content',
      'POST',
      requestData
    );
    
    // Return result
    return {
      commentId: response.id,
      status: response.status
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error adding comment to page ${params.pageId}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed to add comment: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerAddCommentTool = (server: McpServer) => {
  server.tool(
    'addComment',
    'Add a comment to a Confluence page',
    addCommentSchema.shape,
    async (params: AddCommentParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        const result = await addCommentHandler(params, config);
        
        // Return result in MCP Response format
        return createTextResponse(
          `Comment added successfully with ID: ${result.commentId}`,
          { commentId: result.commentId, status: result.status }
        );
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Error while adding comment: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 