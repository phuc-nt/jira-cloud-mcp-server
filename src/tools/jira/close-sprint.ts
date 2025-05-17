import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { closeSprint } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:closeSprint');

export const closeSprintSchema = z.object({
  sprintId: z.string().describe('Sprint ID'),
  completeDate: z.string().optional().describe('Complete date (ISO 8601, optional, e.g. 2025-05-10T12:45:00.000+07:00)')
});

type CloseSprintParams = z.infer<typeof closeSprintSchema>;

async function closeSprintToolImpl(params: CloseSprintParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { sprintId, ...options } = params;
  const result = await closeSprint(config, sprintId, options);
  return {
    success: true,
    sprintId,
    ...options,
    result
  };
}

export const registerCloseSprintTool = (server: McpServer) => {
  server.tool(
    'closeSprint',
    'Close a Jira sprint',
    closeSprintSchema.shape,
    async (params: CloseSprintParams, context: Record<string, any>) => {
      try {
        const result = await closeSprintToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in closeSprint:', error);
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