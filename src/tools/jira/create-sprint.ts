import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { createSprint as createJiraSprint } from '../../utils/atlassian-api.js';

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

interface CreateSprintResult {
  id: string;
  name: string;
  state: string;
  success: boolean;
}

// Main handler to create a new sprint
export async function createSprintHandler(
  params: CreateSprintParams,
  config: any
): Promise<CreateSprintResult> {
  try {
    logger.info(`Creating sprint: ${params.name} for board ${params.boardId}`);
    const response = await createJiraSprint(config, params.boardId, params.name, params.startDate, params.endDate, params.goal);
    return {
      id: response.id,
      name: response.name,
      state: response.state,
      success: true
    };
  } catch (error) {
    logger.error(`Error creating sprint for board ${params.boardId}:`, error);
    throw error;
  }
}

// Register the tool with MCP Server
export const registerCreateSprintTool = (server: McpServer) => {
  server.tool(
    'createSprint',
    'Create a new sprint in Jira',
    createSprintSchema.shape,
    async (params: CreateSprintParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Create new sprint
        const result = await createSprintHandler(params, context.config);
        
        // Return MCP-compliant response
        return createTextResponse(
          `Sprint created successfully with ID: ${result.id}`,
          {
            id: result.id,
            name: result.name,
            state: result.state,
            success: result.success
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while creating sprint: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 