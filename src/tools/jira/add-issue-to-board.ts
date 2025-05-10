import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssueToBoard } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addIssueToBoard');

export const addIssueToBoardSchema = z.object({
  boardId: z.string().describe('Board ID'),
  issueKey: z.union([
    z.string().describe('Issue key (e.g. PROJ-123)'),
    z.array(z.string()).describe('List of issue keys')
  ])
});

export const registerAddIssueToBoardTool = (server: McpServer) => {
  server.tool(
    'addIssueToBoard',
    'Add issue(s) to a Jira board (scrum backlog)',
    addIssueToBoardSchema.shape,
    async (params: z.infer<typeof addIssueToBoardSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, issueKey } = params;
        const result = await addIssueToBoard(config, boardId, issueKey);
        return createTextResponse('Issue(s) added to board successfully', { result });
      } catch (error) {
        logger.error('Error in addIssueToBoard:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 