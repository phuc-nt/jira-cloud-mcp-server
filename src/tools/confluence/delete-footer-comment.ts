import { z } from 'zod';
import { AtlassianConfig, deleteConfluenceFooterCommentV2 } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('ConfluenceTools:deleteFooterComment');

export const deleteFooterCommentSchema = z.object({
  commentId: z.union([z.string(), z.number()]).describe('ID của comment cần xóa (bắt buộc)')
});

type DeleteFooterCommentParams = z.infer<typeof deleteFooterCommentSchema>;

export async function deleteFooterCommentHandler(
  params: DeleteFooterCommentParams,
  config: AtlassianConfig
): Promise<{ success: boolean; id: string|number; message: string }> {
  try {
    logger.info(`Deleting footer comment (v2) with ID: ${params.commentId}`);
    await deleteConfluenceFooterCommentV2(config, params.commentId);
    return {
      success: true,
      id: params.commentId,
      message: `Footer comment ${params.commentId} đã được xóa vĩnh viễn.`
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`Error deleting footer comment (v2) with ID ${params.commentId}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to delete footer comment: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

export const registerDeleteFooterCommentTool = (server: McpServer) => {
  server.tool(
    'deleteFooterComment',
    'Delete a footer comment in Confluence (API v2)',
    deleteFooterCommentSchema.shape,
    async (params: DeleteFooterCommentParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        const config = (context as any).atlassianConfig as AtlassianConfig;
        if (!config) return createErrorResponse('Invalid or missing Atlassian configuration');
        const result = await deleteFooterCommentHandler(params, config);
        return createTextResponse(result.message, { id: result.id, success: result.success });
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        return createErrorResponse(`Error while deleting footer comment: ${error instanceof Error ? error.message : String(error)}`);
      }
    }
  );
}; 