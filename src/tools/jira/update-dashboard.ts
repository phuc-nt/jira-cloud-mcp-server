import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { updateDashboard } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:updateDashboard');

export const updateDashboardSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  name: z.string().optional().describe('Dashboard name'),
  description: z.string().optional().describe('Dashboard description'),
  sharePermissions: z.array(z.any()).optional().describe('Share permissions array')
});

export const registerUpdateDashboardTool = (server: McpServer) => {
  server.tool(
    'updateDashboard',
    'Update a Jira dashboard',
    updateDashboardSchema.shape,
    async (params: z.infer<typeof updateDashboardSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { dashboardId, ...data } = params;
        const result = await updateDashboard(config, dashboardId, data);
        return createTextResponse('Dashboard updated successfully', { result });
      } catch (error) {
        logger.error('Error in updateDashboard:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 