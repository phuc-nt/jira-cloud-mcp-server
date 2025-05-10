import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssueToBoard } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addIssueToBoard');

export const addIssueToBoardSchema = z.object({
  boardId: z.string().describe('Board ID (e.g. 34)'),
  issueKey: z.union([
    z.string(),
    z.array(z.string())
  ]).describe('Issue key(s) to add to board. Accepts a single issue key (e.g. "PROJ-123") or an array of issue keys (e.g. ["PROJ-123", "PROJ-124"]).')
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