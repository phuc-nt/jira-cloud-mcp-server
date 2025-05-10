import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api-base.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { addConfluenceCommentV2 } from '../../utils/confluence-tool-api.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:addComment');

// Input parameter schema
export const addCommentSchema = z.object({
  pageId: z.string().describe('ID of the page to add a comment to'),
  content: z.string().describe('Content of the comment (Confluence storage format, XML-like HTML)')
});

type AddCommentParams = z.infer<typeof addCommentSchema>;

interface AddCommentResult {
  id: string;
  created: string;
  author: string;
  body: string;
  success: boolean;
}

// Main handler to add a comment to a page (API v2)
export async function addCommentHandler(
  params: AddCommentParams,
  config: AtlassianConfig
): Promise<AddCommentResult> {
  try {
    logger.info(`Adding comment (v2) to page: ${params.pageId}`);
    const data = await addConfluenceCommentV2(config, {
      pageId: params.pageId,
      content: params.content
    });
    return {
      id: data.id,
      created: data.createdAt,
      author: data.createdBy?.displayName || '',
      body: data.body?.value || '',
      success: true
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error adding comment (v2) to page ${params.pageId}:`, error);
    let message = `Failed to add comment: ${error instanceof Error ? error.message : String(error)}`;
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      message,
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
          `Comment added successfully with ID: ${result.id}`,
          { id: result.id, created: result.created, author: result.author, body: result.body }
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