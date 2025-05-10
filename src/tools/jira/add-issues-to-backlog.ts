import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssuesToBacklog } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addIssuesToBacklog');

export const addIssuesToBacklogSchema = z.object({
  issueKeys: z.union([
    z.string(),
    z.array(z.string())
  ]).describe('Issue key(s) to move to backlog. Accepts a single issue key (e.g. "PROJ-123") or an array of issue keys (e.g. ["PROJ-123", "PROJ-124"]).'),
  boardId: z.string().optional().describe('Board ID (optional). If provided, issues will be moved to the backlog of this board.')
});

export const registerAddIssuesToBacklogTool = (server: McpServer) => {
  server.tool(
    'addIssuesToBacklog',
    'Move issue(s) to Jira backlog (POST /rest/agile/1.0/backlog/issue or /rest/agile/1.0/backlog/{boardId}/issue)',
    addIssuesToBacklogSchema.shape,
    async (params: z.infer<typeof addIssuesToBacklogSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, issueKeys } = params;
        const keys = Array.isArray(issueKeys) ? issueKeys : [issueKeys];
        // Gọi endpoint phù hợp
        const result = await addIssuesToBacklog(config, keys, boardId);
        return createTextResponse(`Issue(s) moved to backlog successfully${boardId ? ` for board ${boardId}` : ''}`, { result });
      } catch (error) {
        logger.error('Error in addIssuesToBacklog:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 