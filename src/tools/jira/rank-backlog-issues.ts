import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rankBacklogIssues } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:rankBacklogIssues');

export const rankBacklogIssuesSchema = z.object({
  boardId: z.string().describe('Board ID'),
  issueKeys: z.array(z.string()).describe('List of issue keys to rank'),
  rankBeforeIssue: z.string().optional().describe('Rank before this issue key'),
  rankAfterIssue: z.string().optional().describe('Rank after this issue key')
});

export const registerRankBacklogIssuesTool = (server: McpServer) => {
  server.tool(
    'rankBacklogIssues',
    'Rank issues in Jira backlog',
    rankBacklogIssuesSchema.shape,
    async (params: z.infer<typeof rankBacklogIssuesSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, issueKeys, rankBeforeIssue, rankAfterIssue } = params;
        const result = await rankBacklogIssues(config, boardId, issueKeys, { rankBeforeIssue, rankAfterIssue });
        return createTextResponse('Backlog issues ranked successfully', { result });
      } catch (error) {
        logger.error('Error in rankBacklogIssues:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 