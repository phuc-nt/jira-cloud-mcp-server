import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { deleteConfluencePageV2 } from '../../utils/atlassian-api.js';

const logger = Logger.getLogger('ConfluenceTools:deletePage');

export const deletePageSchema = z.object({
  pageId: z.string().describe('ID của trang cần xóa (bắt buộc)'),
  draft: z.boolean().optional().describe('Xóa bản nháp (draft) nếu true'),
  purge: z.boolean().optional().describe('Xóa vĩnh viễn (purge) nếu true')
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
    async (params: DeletePageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        const config = (context as any).atlassianConfig as AtlassianConfig;
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        const result = await deletePageHandler(params, config);
        return createTextResponse(result.message, { success: result.success });
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        return createErrorResponse(
          `Error while deleting page: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 