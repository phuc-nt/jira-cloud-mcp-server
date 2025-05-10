import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { removeIssuesFromBacklog } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:removeIssuesFromBacklog');

export const removeIssuesFromBacklogSchema = z.object({
  boardId: z.string().describe('Board ID'),
  sprintId: z.string().describe('Sprint ID to move issues to'),
  issueKeys: z.array(z.string()).describe('List of issue keys to move')
});

export const registerRemoveIssuesFromBacklogTool = (server: McpServer) => {
  server.tool(
    'removeIssuesFromBacklog',
    'Remove issues from Jira backlog (move to sprint)',
    removeIssuesFromBacklogSchema.shape,
    async (params: z.infer<typeof removeIssuesFromBacklogSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, sprintId, issueKeys } = params;
        const result = await removeIssuesFromBacklog(config, boardId, sprintId, issueKeys);
        return createTextResponse('Issues moved from backlog to sprint successfully', { result });
      } catch (error) {
        logger.error('Error in removeIssuesFromBacklog:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 