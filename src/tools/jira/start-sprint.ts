import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { startSprint } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:startSprint');

export const startSprintSchema = z.object({
  sprintId: z.string().describe('Sprint ID'),
  startDate: z.string().describe('Start date (ISO 8601)'),
  endDate: z.string().describe('End date (ISO 8601)'),
  goal: z.string().optional().describe('Sprint goal')
});

export const registerStartSprintTool = (server: McpServer) => {
  server.tool(
    'startSprint',
    'Start a Jira sprint',
    startSprintSchema.shape,
    async (params: z.infer<typeof startSprintSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { sprintId, startDate, endDate, goal } = params;
        const result = await startSprint(config, sprintId, startDate, endDate, goal);
        return createTextResponse('Sprint started successfully', { result });
      } catch (error) {
        logger.error('Error in startSprint:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 