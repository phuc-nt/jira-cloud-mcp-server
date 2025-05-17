import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { transitionIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:transitionIssue');

// Input parameter schema
export const transitionIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  transitionId: z.string().describe('ID of the transition to apply'),
  comment: z.string().optional().describe('Comment when performing the transition')
});

type TransitionIssueParams = z.infer<typeof transitionIssueSchema>;

async function transitionIssueToolImpl(params: TransitionIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Transitioning issue ${params.issueIdOrKey} with transition ${params.transitionId}`);
  const result = await transitionIssue(
    config,
    params.issueIdOrKey,
    params.transitionId,
    params.comment
  );
  return {
    issueIdOrKey: params.issueIdOrKey,
    success: result.success,
    transitionId: params.transitionId,
    message: result.message
  };
}

// Register the tool with MCP Server
export const registerTransitionIssueTool = (server: McpServer) => {
  server.tool(
    'transitionIssue',
    'Transition the status of a Jira issue',
    transitionIssueSchema.shape,
    async (params: TransitionIssueParams, context: Record<string, any>) => {
      try {
        const result = await transitionIssueToolImpl(params, context);
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