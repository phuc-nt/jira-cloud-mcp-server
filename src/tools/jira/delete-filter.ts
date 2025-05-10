import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { deleteFilter as deleteJiraFilter } from '../../utils/jira-tool-api.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:deleteFilter');

// Input parameter schema
export const deleteFilterSchema = z.object({
  filterId: z.string().describe('Filter ID to delete')
});

type DeleteFilterParams = z.infer<typeof deleteFilterSchema>;

interface DeleteFilterResult {
  success: boolean;
}

// Main handler to delete a filter
export async function deleteFilterHandler(
  params: DeleteFilterParams,
  config: any
): Promise<DeleteFilterResult> {
  try {
    logger.info(`Deleting filter with ID: ${params.filterId}`);
    await deleteJiraFilter(config, params.filterId);
    return {
      success: true
    };
  } catch (error) {
    logger.error(`Error deleting filter ${params.filterId}:`, error);
    throw error;
  }
}

// Register the tool with MCP Server
export const registerDeleteFilterTool = (server: McpServer) => {
  server.tool(
    'deleteFilter',
    'Delete a filter in Jira',
    deleteFilterSchema.shape,
    async (params: DeleteFilterParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Kiểm tra atlassianConfig và email, fallback sang biến môi trường nếu cần
        if (!context.atlassianConfig) {
          logger.error('[deleteFilter] Missing Atlassian config in context:', JSON.stringify(context));
          return createErrorResponse('Missing Atlassian config in context');
        }
        if (!context.atlassianConfig.email) {
          logger.warn('[deleteFilter] context.atlassianConfig.email is missing. Trying to get from env...');
          const envEmail = process.env.JIRA_EMAIL || process.env.ATLASSIAN_EMAIL || process.env.ATLASSIAN_USER_EMAIL;
          logger.warn('[deleteFilter] Env JIRA_EMAIL:', process.env.JIRA_EMAIL);
          logger.warn('[deleteFilter] Env ATLASSIAN_EMAIL:', process.env.ATLASSIAN_EMAIL);
          logger.warn('[deleteFilter] Env ATLASSIAN_USER_EMAIL:', process.env.ATLASSIAN_USER_EMAIL);
          if (envEmail) {
            logger.info('[deleteFilter] Using email from env:', envEmail);
            context.atlassianConfig.email = envEmail;
          } else {
            logger.error('[deleteFilter] Missing Atlassian user email in context and environment. Context:', JSON.stringify(context));
            return createErrorResponse('Missing Atlassian user email in context and environment');
          }
        }
        // Delete filter
        const result = await deleteFilterHandler(params, context.atlassianConfig);
        // Return MCP-compliant response
        return createTextResponse(
          `Filter ${params.filterId} deleted successfully`,
          {
            success: result.success
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while deleting filter: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 