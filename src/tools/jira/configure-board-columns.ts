import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { configureBoardColumns } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

const logger = Logger.getLogger('JiraTools:configureBoardColumns');

export const configureBoardColumnsSchema = z.object({
  boardId: z.string().describe('Board ID'),
  columns: z.array(z.object({
    name: z.string().describe('Column name'),
    statuses: z.array(z.string()).describe('List of status IDs')
  })).describe('List of columns')
});

export const registerConfigureBoardColumnsTool = (server: McpServer) => {
  server.tool(
    'configureBoardColumns',
    'Configure columns of a Jira board',
    configureBoardColumnsSchema.shape,
    async (params: z.infer<typeof configureBoardColumnsSchema>, context: Record<string, any>) => {
      try {
        const config = context.atlassianConfig;
        if (!config) return createErrorResponse('Missing Atlassian config');
        const { boardId, columns } = params;
        const result = await configureBoardColumns(config, boardId, columns);
        return createTextResponse('Board columns configured successfully', { result });
      } catch (error) {
        logger.error('Error in configureBoardColumns:', error);
        return createErrorResponse(error instanceof Error ? error.message : String(error));
      }
    }
  );
}; 