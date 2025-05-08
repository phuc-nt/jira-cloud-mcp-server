import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssuesToBacklog } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addIssuesToBacklog');

export const addIssuesToBacklogSchema = z.object({
  boardId: z.string().describe('Board ID'),
  issueKeys: z.array(z.string()).describe('List of issue keys to add to backlog')
});

export const registerAddIssuesToBacklogTool = (server: McpServer) => {
  server.tool(
    'addIssuesToBacklog',
    'Add issues to Jira backlog',
    addIssuesToBacklogSchema.shape,
    async (params: z.infer<typeof addIssuesToBacklogSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, issueKeys } = params;
        const result = await addIssuesToBacklog(config, boardId, issueKeys);
        return createTextResponse('Issues added to backlog successfully', { result });
      } catch (error) {
        logger.error('Error in addIssuesToBacklog:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 