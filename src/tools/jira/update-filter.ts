import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { updateFilter as updateJiraFilter } from '../../utils/jira-tool-api.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateFilter');

// Input parameter schema
export const updateFilterSchema = z.object({
  filterId: z.string().describe('Filter ID to update'),
  name: z.string().optional().describe('New filter name'),
  jql: z.string().optional().describe('New JQL query'),
  description: z.string().optional().describe('New description'),
  favourite: z.boolean().optional().describe('Mark as favourite')
});

type UpdateFilterParams = z.infer<typeof updateFilterSchema>;

interface UpdateFilterResult {
  id: string;
  name: string;
  self: string;
  success: boolean;
}

// Main handler to update a filter
export async function updateFilterHandler(
  params: UpdateFilterParams,
  config: any
): Promise<UpdateFilterResult> {
  try {
    logger.info(`Updating filter with ID: ${params.filterId}`);
    const response = await updateJiraFilter(config, params.filterId, params);
    return {
      id: response.id,
      name: response.name,
      self: response.self,
      success: true
    };
  } catch (error) {
    logger.error(`Error updating filter ${params.filterId}:`, error);
    throw error;
  }
}

// Register the tool with MCP Server
export const registerUpdateFilterTool = (server: McpServer) => {
  server.tool(
    'updateFilter',
    'Update an existing filter in Jira',
    updateFilterSchema.shape,
    async (params: UpdateFilterParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Kiểm tra atlassianConfig và email, fallback sang biến môi trường nếu cần
        if (!context.atlassianConfig) {
          logger.error('[updateFilter] Missing Atlassian config in context:', JSON.stringify(context));
          return createErrorResponse('Missing Atlassian config in context');
        }
        if (!context.atlassianConfig.email) {
          logger.warn('[updateFilter] context.atlassianConfig.email is missing. Trying to get from env...');
          const envEmail = process.env.JIRA_EMAIL || process.env.ATLASSIAN_EMAIL || process.env.ATLASSIAN_USER_EMAIL;
          logger.warn('[updateFilter] Env JIRA_EMAIL:', process.env.JIRA_EMAIL);
          logger.warn('[updateFilter] Env ATLASSIAN_EMAIL:', process.env.ATLASSIAN_EMAIL);
          logger.warn('[updateFilter] Env ATLASSIAN_USER_EMAIL:', process.env.ATLASSIAN_USER_EMAIL);
          if (envEmail) {
            logger.info('[updateFilter] Using email from env:', envEmail);
            context.atlassianConfig.email = envEmail;
          } else {
            logger.error('[updateFilter] Missing Atlassian user email in context and environment. Context:', JSON.stringify(context));
            return createErrorResponse('Missing Atlassian user email in context and environment');
          }
        }
        // Update filter
        const result = await updateFilterHandler(params, context.atlassianConfig);
        // Return MCP-compliant response
        return createTextResponse(
          `Filter ${params.filterId} updated successfully`,
          {
            id: result.id,
            name: result.name,
            self: result.self,
            success: result.success
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while updating filter: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 