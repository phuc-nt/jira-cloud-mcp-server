import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { removeGadgetFromDashboard } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:removeGadgetFromDashboard');

export const removeGadgetFromDashboardSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  gadgetId: z.string().describe('Gadget ID')
});

export const registerRemoveGadgetFromDashboardTool = (server: McpServer) => {
  server.tool(
    'removeGadgetFromDashboard',
    'Remove gadget from Jira dashboard',
    removeGadgetFromDashboardSchema.shape,
    async (params: z.infer<typeof removeGadgetFromDashboardSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { dashboardId, gadgetId } = params;
        const result = await removeGadgetFromDashboard(config, dashboardId, gadgetId);
        return createTextResponse('Gadget removed from dashboard successfully', { result });
      } catch (error) {
        logger.error('Error in removeGadgetFromDashboard:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 