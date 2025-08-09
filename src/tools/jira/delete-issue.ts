import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:deleteIssue');

// Input parameter schema
export const deleteIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  deleteSubtasks: z.boolean().optional().describe('Delete subtasks if they exist (default: false)')
});

type DeleteIssueParams = z.infer<typeof deleteIssueSchema>;

async function deleteIssueImpl(params: DeleteIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Deleting issue: ${params.issueKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.deleteSubtasks !== undefined) {
      queryParams.append('deleteSubtasks', params.deleteSubtasks.toString());
    }

    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, { 
      method: 'DELETE',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (delete issue, ${response.status}):`, responseText);
      
      const statusCode = response.status;
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Bad request. The issue cannot be deleted (may have subtasks that need to be deleted first)",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "Forbidden. You don't have permission to delete this issue.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Issue ${params.issueKey} not found`,
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }

    // Success - no content returned for 204
    return {
      success: true,
      message: `Issue ${params.issueKey} deleted successfully`,
      issueKey: params.issueKey,
      deletedSubtasks: params.deleteSubtasks || false
    };

  } catch (error) {
    logger.error('Error deleting issue:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error deleting issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export const registerDeleteIssueTool = (server: McpServer) => {
  server.tool(
    'deleteIssue',
    'Delete a Jira issue (DELETE /rest/api/3/issue/{issueKey})',
    deleteIssueSchema.shape,
    async (params: DeleteIssueParams, context: Record<string, any>) => {
      try {
        const result = await deleteIssueImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in deleteIssue:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error) 
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
