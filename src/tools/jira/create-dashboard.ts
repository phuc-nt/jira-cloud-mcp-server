import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { createDashboard } from '../../utils/jira-tool-api-v3.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:createDashboard');

export const createDashboardSchema = z.object({
  name: z.string().describe('Dashboard name'),
  description: z.string().optional().describe('Dashboard description'),
  sharePermissions: z.array(z.any()).optional().describe('Share permissions array')
});

type CreateDashboardParams = z.infer<typeof createDashboardSchema>;

async function createDashboardToolImpl(params: CreateDashboardParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const result = await createDashboard(config, params);
  return {
    success: true,
    ...result
  };
}

export const registerCreateDashboardTool = (server: McpServer) => {
  server.tool(
    'createDashboard',
    'Create a new Jira dashboard',
    createDashboardSchema.shape,
    async (params: CreateDashboardParams, context: Record<string, any>) => {
      try {
        const result = await createDashboardToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in createDashboard:', error);
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