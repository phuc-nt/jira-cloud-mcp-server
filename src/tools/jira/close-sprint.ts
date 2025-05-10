import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { closeSprint } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:closeSprint');

export const closeSprintSchema = z.object({
  sprintId: z.string().describe('Sprint ID'),
  completeDate: z.string().optional().describe('Complete date (ISO 8601, optional, e.g. 2025-05-10T12:45:00.000+07:00)')
});

export const registerCloseSprintTool = (server: McpServer) => {
  server.tool(
    'closeSprint',
    'Close a Jira sprint',
    closeSprintSchema.shape,
    async (params: z.infer<typeof closeSprintSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { sprintId, ...options } = params;
        const result = await closeSprint(config, sprintId, options);
        return createTextResponse('Sprint closed successfully', { result });
      } catch (error) {
        logger.error('Error in closeSprint:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 