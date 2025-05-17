import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { removeGadgetFromDashboard } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:removeGadgetFromDashboard');

export const removeGadgetFromDashboardSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  gadgetId: z.string().describe('Gadget ID')
});

type RemoveGadgetFromDashboardParams = z.infer<typeof removeGadgetFromDashboardSchema>;

async function removeGadgetFromDashboardToolImpl(params: RemoveGadgetFromDashboardParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { dashboardId, gadgetId } = params;
  const result = await removeGadgetFromDashboard(config, dashboardId, gadgetId);
  return {
    success: true,
    dashboardId,
    gadgetId,
    result
  };
}

export const registerRemoveGadgetFromDashboardTool = (server: McpServer) => {
  server.tool(
    'removeGadgetFromDashboard',
    'Remove gadget from Jira dashboard',
    removeGadgetFromDashboardSchema.shape,
    async (params: RemoveGadgetFromDashboardParams, context: Record<string, any>) => {
      try {
        const result = await removeGadgetFromDashboardToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in removeGadgetFromDashboard:', error);
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