import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { deleteConfluencePageV2 } from '../../utils/confluence-tool-api.js';
import { Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceTools:deletePage');

export const deletePageSchema = z.object({
  pageId: z.string().describe('ID of the page to delete (required)'),
  draft: z.boolean().optional().describe('Delete draft version if true'),
  purge: z.boolean().optional().describe('Permanently delete (purge) if true')
});

type DeletePageParams = z.infer<typeof deletePageSchema>;

// Main handler
export async function deletePageHandler(
  params: DeletePageParams,
  config: AtlassianConfig
): Promise<{ success: boolean; message: string }> {
  try {
    logger.info(`Deleting page (v2) with ID: ${params.pageId}`);
    await deleteConfluencePageV2(config, params);
    return { success: true, message: `Page ${params.pageId} deleted successfully.` };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error deleting page (v2) with ID ${params.pageId}:`, error);
    let message = `Failed to delete page: ${error instanceof Error ? error.message : String(error)}`;
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      message,
      500
    );
  }
}

// Register tool
export const registerDeletePageTool = (server: McpServer) => {
  server.tool(
    'deletePage',
    'Delete a Confluence page (API v2)',
    deletePageSchema.shape,
    async (params: DeletePageParams, context: Record<string, any>) => {
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
        const result = await deletePageHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: result.message
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
                message: `Error while deleting page: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 