import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { updateFilter } from '../../utils/jira-tool-api-v3.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateFilter');

// Input parameter schema
export const updateFilterSchema = z.object({
  filterId: z.string().describe('Filter ID to update'),
  name: z.string().optional().describe('New filter name'),
  jql: z.string().optional().describe('New JQL query'),
  description: z.string().optional().describe('New description'),
  favourite: z.boolean().optional().describe('Mark as favourite')
});

type UpdateFilterParams = z.infer<typeof updateFilterSchema>;

async function updateFilterToolImpl(params: UpdateFilterParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  logger.info(`Updating filter with ID: ${params.filterId}`);
  const response = await updateFilter(config, params.filterId, params);
  return {
    id: response.id,
    name: response.name,
    self: response.self,
    success: true
  };
}

// Register the tool with MCP Server
export const registerUpdateFilterTool = (server: McpServer) => {
  server.tool(
    'updateFilter',
    'Update an existing filter in Jira',
    updateFilterSchema.shape,
    async (params: UpdateFilterParams, context: Record<string, any>) => {
      try {
        const result = await updateFilterToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in updateFilter:', error);
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