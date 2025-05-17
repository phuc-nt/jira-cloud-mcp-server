import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { rankBacklogIssues } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:rankBacklogIssues');

export const rankBacklogIssuesSchema = z.object({
  boardId: z.string().describe('Board ID'),
  issueKeys: z.array(z.string()).describe('List of issue keys to rank'),
  rankBeforeIssue: z.string().optional().describe('Rank before this issue key'),
  rankAfterIssue: z.string().optional().describe('Rank after this issue key')
});

type RankBacklogIssuesParams = z.infer<typeof rankBacklogIssuesSchema>;

async function rankBacklogIssuesToolImpl(params: RankBacklogIssuesParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { boardId, issueKeys, rankBeforeIssue, rankAfterIssue } = params;
  const result = await rankBacklogIssues(config, boardId, issueKeys, { rankBeforeIssue, rankAfterIssue });
  return {
    success: true,
    boardId,
    issueKeys,
    rankBeforeIssue: rankBeforeIssue || null,
    rankAfterIssue: rankAfterIssue || null,
    result
  };
}

export const registerRankBacklogIssuesTool = (server: McpServer) => {
  server.tool(
    'rankBacklogIssues',
    'Rank issues in Jira backlog',
    rankBacklogIssuesSchema.shape,
    async (params: RankBacklogIssuesParams, context: Record<string, any>) => {
      try {
        const result = await rankBacklogIssuesToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in rankBacklogIssues:', error);
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