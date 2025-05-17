import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssueToSprint } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('JiraTools:addIssueToSprint');

export const addIssueToSprintSchema = z.object({
  sprintId: z.string().describe('Target sprint ID (must be future or active)'),
  issueKeys: z.array(z.string()).min(1).max(50).describe('List of issue keys to move to the sprint (max 50)')
});

type AddIssueToSprintParams = z.infer<typeof addIssueToSprintSchema>;

async function addIssueToSprintToolImpl(params: AddIssueToSprintParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  const { sprintId, issueKeys } = params;
  const result = await addIssueToSprint(config, sprintId, issueKeys);
  return {
    success: true,
    sprintId,
    issueKeys,
    result
  };
}

export const registerAddIssueToSprintTool = (server: McpServer) => {
  server.tool(
    'addIssueToSprint',
    'Add issues to a Jira sprint (POST /rest/agile/1.0/sprint/{sprintId}/issue)',
    addIssueToSprintSchema.shape,
    async (params: AddIssueToSprintParams, context: Record<string, any>) => {
      try {
        const result = await addIssueToSprintToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in addIssueToSprint:', error);
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