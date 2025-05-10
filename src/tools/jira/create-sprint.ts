import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { createSprint as createJiraSprint } from '../../utils/jira-tool-api.js';

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
        // Kiểm tra atlassianConfig và email, fallback sang biến môi trường nếu cần
        if (!context.atlassianConfig) {
          logger.error('[createSprint] Missing Atlassian config in context:', JSON.stringify(context));
          return createErrorResponse('Missing Atlassian config in context');
        }
        if (!context.atlassianConfig.email) {
          logger.warn('[createSprint] context.atlassianConfig.email is missing. Trying to get from env...');
          const envEmail = process.env.JIRA_EMAIL || process.env.ATLASSIAN_EMAIL || process.env.ATLASSIAN_USER_EMAIL;
          logger.warn('[createSprint] Env JIRA_EMAIL:', process.env.JIRA_EMAIL);
          logger.warn('[createSprint] Env ATLASSIAN_EMAIL:', process.env.ATLASSIAN_EMAIL);
          logger.warn('[createSprint] Env ATLASSIAN_USER_EMAIL:', process.env.ATLASSIAN_USER_EMAIL);
          if (envEmail) {
            logger.info('[createSprint] Using email from env:', envEmail);
            context.atlassianConfig.email = envEmail;
          } else {
            logger.error('[createSprint] Missing Atlassian user email in context and environment. Context:', JSON.stringify(context));
            return createErrorResponse('Missing Atlassian user email in context and environment');
          }
        }
        // Create new sprint
        const result = await createSprintHandler(params, context.atlassianConfig);
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