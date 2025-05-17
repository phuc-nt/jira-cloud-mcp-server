import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { deleteConfluenceFooterCommentV2 } from '../../utils/confluence-tool-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceTools:deleteFooterComment');

export const deleteFooterCommentSchema = z.object({
  commentId: z.union([z.string(), z.number()]).describe('ID of the comment to delete (required)')
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
    async (params: DeleteFooterCommentParams, context: Record<string, any>) => {
      try {
        const config = context?.atlassianConfig ?? Config.getAtlassianConfigFromEnv();
        if (!config) {
          return {
            content: [
              { type: 'text', text: 'Invalid or missing Atlassian configuration' }
            ],
            isError: true
          };
        }
        const result = await deleteFooterCommentHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: result.message,
                id: result.id
              })
            }
          ]
        };
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: error.message,
                  code: error.code,
                  statusCode: error.statusCode,
                  type: error.type
                })
              }
            ],
            isError: true
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Error while deleting footer comment: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 