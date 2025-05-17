import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssuesToBacklog } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:addIssuesToBacklog');

export const addIssuesToBacklogSchema = z.object({
  issueKeys: z.union([
    z.string(),
    z.array(z.string())
  ]).describe('Issue key(s) to move to backlog. Accepts a single issue key (e.g. "PROJ-123") or an array of issue keys (e.g. ["PROJ-123", "PROJ-124"]).'),
  boardId: z.string().optional().describe('Board ID (optional). If provided, issues will be moved to the backlog of this board.')
});

type AddIssuesToBacklogParams = z.infer<typeof addIssuesToBacklogSchema>;

async function addIssuesToBacklogToolImpl(params: AddIssuesToBacklogParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { boardId, issueKeys } = params;
  const keys = Array.isArray(issueKeys) ? issueKeys : [issueKeys];
  const result = await addIssuesToBacklog(config, keys, boardId);
  return {
    success: true,
    boardId: boardId || null,
    issueKeys: keys,
    result
  };
}

export const registerAddIssuesToBacklogTool = (server: McpServer) => {
  server.tool(
    'addIssuesToBacklog',
    'Move issue(s) to Jira backlog (POST /rest/agile/1.0/backlog/issue or /rest/agile/1.0/backlog/{boardId}/issue)',
    addIssuesToBacklogSchema.shape,
    async (params: AddIssuesToBacklogParams, context: Record<string, any>) => {
      try {
        const result = await addIssuesToBacklogToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in addIssuesToBacklog:', error);
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