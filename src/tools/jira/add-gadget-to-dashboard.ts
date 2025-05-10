import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addGadgetToDashboard } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addGadgetToDashboard');

export const addGadgetToDashboardSchema = z.object({
  dashboardId: z.string().describe('Dashboard ID'),
  uri: z.string().describe('Gadget URI'),
  color: z.string().optional().describe('Gadget color'),
  position: z.any().optional().describe('Gadget position'),
  title: z.string().optional().describe('Gadget title'),
  properties: z.any().optional().describe('Gadget properties')
});

export const registerAddGadgetToDashboardTool = (server: McpServer) => {
  server.tool(
    'addGadgetToDashboard',
    'Add gadget to Jira dashboard',
    addGadgetToDashboardSchema.shape,
    async (params: z.infer<typeof addGadgetToDashboardSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { dashboardId, ...data } = params;
        const result = await addGadgetToDashboard(config, dashboardId, data);
        return createTextResponse('Gadget added to dashboard successfully', { result });
      } catch (error) {
        logger.error('Error in addGadgetToDashboard:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 