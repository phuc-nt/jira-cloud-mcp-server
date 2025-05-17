import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createSuccessResponse, createErrorResponse } from '../../utils/mcp-core.js';
import { updateConfluencePageTitleV2 } from '../../utils/confluence-tool-api.js';
import { Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceTools:updatePageTitle');

export const updatePageTitleSchema = z.object({
  pageId: z.string().describe('ID of the page to update the title (required)'),
  title: z.string().describe('New title of the page (required)'),
  version: z.number().describe('New version number (required, must be exactly one greater than the current version)')
});

type UpdatePageTitleParams = z.infer<typeof updatePageTitleSchema>;

export async function updatePageTitleHandler(
  params: UpdatePageTitleParams,
  config: AtlassianConfig
): Promise<{ success: boolean; id: string; title: string; version: number; message: string }> {
  try {
    logger.info(`Updating page title (v2) with ID: ${params.pageId}`);
    const data = await updateConfluencePageTitleV2(config, params);
    return {
      success: true,
      id: data.id,
      title: data.title,
      version: data.version?.number,
      message: `Page ${data.id} title updated to "${data.title}" (version ${data.version?.number}) successfully.`
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error updating page title (v2) with ID ${params.pageId}:`, error);
    let message = `Failed to update page title: ${error instanceof Error ? error.message : String(error)}`;
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      message,
      500
    );
  }
}

export const registerUpdatePageTitleTool = (server: McpServer) => {
  server.tool(
    'updatePageTitle',
    'Update the title of a Confluence page (API v2)',
    updatePageTitleSchema.shape,
    async (params: UpdatePageTitleParams, context: Record<string, any>) => {
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
        const result = await updatePageTitleHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: result.message,
                id: result.id,
                title: result.title,
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
                message: `Error while updating page title: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 