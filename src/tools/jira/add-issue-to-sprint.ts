import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { addIssueToSprint } from '../../utils/jira-tool-api-agile.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:addIssueToSprint');

export const addIssueToSprintSchema = z.object({
  sprintId: z.string().describe('Target sprint ID (must be future or active)'),
  issueKeys: z.array(z.string()).min(1).max(50).describe('List of issue keys to move to the sprint (max 50)')
});

export const registerAddIssueToSprintTool = (server: McpServer) => {
  server.tool(
    'addIssueToSprint',
    'Add issues to a Jira sprint (POST /rest/agile/1.0/sprint/{sprintId}/issue)',
    addIssueToSprintSchema.shape,
    async (params: z.infer<typeof addIssueToSprintSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { sprintId, issueKeys } = params;
        const result = await addIssueToSprint(config, sprintId, issueKeys);
        return createTextResponse('Issues added to sprint successfully', { result });
      } catch (error) {
        logger.error('Error in addIssueToSprint:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 