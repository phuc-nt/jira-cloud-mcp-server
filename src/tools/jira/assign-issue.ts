import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { assignIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:assignIssue');

// Input parameter schema
export const assignIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  accountId: z.string().optional().describe('Account ID of the assignee (leave blank to unassign)')
});

type AssignIssueParams = z.infer<typeof assignIssueSchema>;

async function assignIssueToolImpl(params: AssignIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Assigning issue ${params.issueIdOrKey} to ${params.accountId || 'no one'}`);
  const result = await assignIssue(
    config,
    params.issueIdOrKey,
    params.accountId || null
  );
  return {
    issueIdOrKey: params.issueIdOrKey,
    success: result.success,
    assignee: params.accountId || null,
    message: params.accountId
      ? `Issue ${params.issueIdOrKey} assigned to user with account ID: ${params.accountId}`
      : `Issue ${params.issueIdOrKey} unassigned`
  };
}

export const registerAssignIssueTool = (server: McpServer) => {
  server.tool(
    'assignIssue',
    'Assign a Jira issue to a user',
    assignIssueSchema.shape,
    async (params: AssignIssueParams, context: Record<string, any>) => {
      try {
        const result = await assignIssueToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
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