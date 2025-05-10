import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { moveIssuesBetweenSprints } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:moveIssuesBetweenSprints');

export const moveIssuesBetweenSprintsSchema = z.object({
  fromSprintId: z.string().describe('Source sprint ID'),
  toSprintId: z.string().describe('Target sprint ID'),
  issueKeys: z.array(z.string()).describe('List of issue keys to move')
});

export const registerMoveIssuesBetweenSprintsTool = (server: McpServer) => {
  server.tool(
    'moveIssuesBetweenSprints',
    'Move issues between Jira sprints',
    moveIssuesBetweenSprintsSchema.shape,
    async (params: z.infer<typeof moveIssuesBetweenSprintsSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { fromSprintId, toSprintId, issueKeys } = params;
        const result = await moveIssuesBetweenSprints(config, fromSprintId, toSprintId, issueKeys);
        return createTextResponse('Issues moved between sprints successfully', { result });
      } catch (error) {
        logger.error('Error in moveIssuesBetweenSprints:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 