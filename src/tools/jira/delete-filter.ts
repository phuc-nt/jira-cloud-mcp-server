import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { deleteFilter as deleteJiraFilter } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:deleteFilter');

// Input parameter schema
export const deleteFilterSchema = z.object({
  filterId: z.string().describe('Filter ID to delete')
});

type DeleteFilterParams = z.infer<typeof deleteFilterSchema>;

interface DeleteFilterResult {
  success: boolean;
}

// Main handler to delete a filter
export async function deleteFilterHandler(
  params: DeleteFilterParams,
  config: any
): Promise<DeleteFilterResult> {
  try {
    logger.info(`Deleting filter with ID: ${params.filterId}`);
    await deleteJiraFilter(config, params.filterId);
    return {
      success: true
    };
  } catch (error) {
    logger.error(`Error deleting filter ${params.filterId}:`, error);
    throw error;
  }
}

// Register the tool with MCP Server
export const registerDeleteFilterTool = (server: McpServer) => {
  server.tool(
    'deleteFilter',
    'Delete a filter in Jira',
    deleteFilterSchema.shape,
    async (params: DeleteFilterParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Delete filter
        const result = await deleteFilterHandler(params, context.config);
        
        // Return MCP-compliant response
        return createTextResponse(
          `Filter ${params.filterId} deleted successfully`,
          {
            success: result.success
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while deleting filter: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 