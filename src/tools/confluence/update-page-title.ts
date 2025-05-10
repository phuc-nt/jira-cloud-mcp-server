import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { updateConfluencePageTitleV2 } from '../../utils/confluence-tool-api.js';

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
    async (params: UpdatePageTitleParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        const config = (context as any).atlassianConfig as AtlassianConfig;
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        const result = await updatePageTitleHandler(params, config);
        return createTextResponse(result.message, { id: result.id, title: result.title, version: result.version, success: result.success });
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        return createErrorResponse(
          `Error while updating page title: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 