import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { updateConfluenceFooterCommentV2 } from '../../utils/confluence-tool-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceTools:updateFooterComment');

export const updateFooterCommentSchema = z.object({
  commentId: z.union([z.string(), z.number()]).describe('ID of the comment to update (required)'),
  version: z.number().describe('New version number (required, must be exactly one greater than the current version)'),
  value: z.string().describe('New content of the comment (required)'),
  representation: z.string().optional().describe('Content representation, default is "storage"'),
  message: z.string().optional().describe('Update message (optional)')
});

type UpdateFooterCommentParams = z.infer<typeof updateFooterCommentSchema>;

export async function updateFooterCommentHandler(
  params: UpdateFooterCommentParams,
  config: AtlassianConfig
): Promise<{ success: boolean; id: string|number; version: number; message: string }> {
  try {
    logger.info(`Updating footer comment (v2) with ID: ${params.commentId}`);
    const data = await updateConfluenceFooterCommentV2(config, params);
    return {
      success: true,
      id: params.commentId,
      version: data.version?.number,
      message: `Footer comment ${params.commentId} updated to version ${data.version?.number} thành công.`
    };
  } catch (error) {
    if (error instanceof ApiError) throw error;
    logger.error(`Error updating footer comment (v2) with ID ${params.commentId}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to update footer comment: ${error instanceof Error ? error.message : String(error)}`, 500);
  }
}

export const registerUpdateFooterCommentTool = (server: McpServer) => {
  server.tool(
    'updateFooterComment',
    'Update a footer comment in Confluence (API v2)',
    updateFooterCommentSchema.shape,
    async (params: UpdateFooterCommentParams, context: Record<string, any>) => {
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
        const result = await updateFooterCommentHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: result.message,
                id: result.id,
                version: result.version
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
                message: `Error while updating footer comment: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 