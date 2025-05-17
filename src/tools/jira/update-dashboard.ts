import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { updateDashboard } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:updateDashboard');

export const updateDashboardSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  name: z.string().optional().describe('Dashboard name'),
  description: z.string().optional().describe('Dashboard description'),
  sharePermissions: z.array(z.any()).optional().describe('Share permissions array')
});

type UpdateDashboardParams = z.infer<typeof updateDashboardSchema>;

async function updateDashboardToolImpl(params: UpdateDashboardParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { dashboardId, ...data } = params;
  const result = await updateDashboard(config, dashboardId, data);
  return {
    success: true,
    dashboardId,
    ...result
  };
}

export const registerUpdateDashboardTool = (server: McpServer) => {
  server.tool(
    'updateDashboard',
    'Update a Jira dashboard',
    updateDashboardSchema.shape,
    async (params: UpdateDashboardParams, context: Record<string, any>) => {
      try {
        const result = await updateDashboardToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in updateDashboard:', error);
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