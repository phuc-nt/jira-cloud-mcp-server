import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { createSprint } from '../../utils/jira-tool-api-agile.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createSprint');

// Input parameter schema
export const createSprintSchema = z.object({
  boardId: z.string().describe('Board ID'),
  name: z.string().describe('Sprint name'),
  startDate: z.string().optional().describe('Start date (ISO format)'),
  endDate: z.string().optional().describe('End date (ISO format)'),
  goal: z.string().optional().describe('Sprint goal')
});

type CreateSprintParams = z.infer<typeof createSprintSchema>;

async function createSprintToolImpl(params: CreateSprintParams, context: any) {
  const config = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating sprint: ${params.name} for board ${params.boardId}`);
  const response = await createSprint(config, params.boardId, params.name, params.startDate, params.endDate, params.goal);
  return {
    id: response.id,
    name: response.name,
    state: response.state,
    success: true
  };
}

// Register the tool with MCP Server
export const registerCreateSprintTool = (server: McpServer) => {
  server.tool(
    'createSprint',
    'Create a new sprint in Jira',
    createSprintSchema.shape,
    async (params: CreateSprintParams, context: Record<string, any>) => {
      try {
        const result = await createSprintToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in createSprint:', error);
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