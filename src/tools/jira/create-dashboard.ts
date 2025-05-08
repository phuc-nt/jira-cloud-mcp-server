import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDashboard } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:createDashboard');

export const createDashboardSchema = z.object({
  name: z.string().describe('Dashboard name'),
  description: z.string().optional().describe('Dashboard description'),
  sharePermissions: z.array(z.any()).optional().describe('Share permissions array')
});

export const registerCreateDashboardTool = (server: McpServer) => {
  server.tool(
    'createDashboard',
    'Create a new Jira dashboard',
    createDashboardSchema.shape,
    async (params: z.infer<typeof createDashboardSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const result = await createDashboard(config, params);
        return createTextResponse('Dashboard created successfully', { result });
      } catch (error) {
        logger.error('Error in createDashboard:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 