import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { deleteFilter } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:deleteFilter');

// Input parameter schema
export const deleteFilterSchema = z.object({
  filterId: z.string().describe('Filter ID to delete')
});

type DeleteFilterParams = z.infer<typeof deleteFilterSchema>;

async function deleteFilterToolImpl(params: DeleteFilterParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  logger.info(`Deleting filter with ID: ${params.filterId}`);
  await deleteFilter(config, params.filterId);
  return {
    success: true,
    filterId: params.filterId
  };
}

// Register the tool with MCP Server
export const registerDeleteFilterTool = (server: McpServer) => {
  server.tool(
    'deleteFilter',
    'Delete a filter in Jira',
    deleteFilterSchema.shape,
    async (params: DeleteFilterParams, context: Record<string, any>) => {
      try {
        const result = await deleteFilterToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in deleteFilter:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 