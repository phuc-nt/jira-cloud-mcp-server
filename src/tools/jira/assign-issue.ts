import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { assignIssue } from '../../utils/jira-tool-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:assignIssue');

// Input parameter schema
export const assignIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  accountId: z.string().optional().describe('Account ID of the assignee (leave blank to unassign)')
});

type AssignIssueParams = z.infer<typeof assignIssueSchema>;

interface AssignIssueResult {
  issueIdOrKey: string;
  success: boolean;
  assignee: string | null;
  message: string;
}

// Main handler to assign an issue
export async function assignIssueHandler(
  params: AssignIssueParams,
  config: AtlassianConfig
): Promise<AssignIssueResult> {
  try {
    logger.info(`Assigning issue ${params.issueIdOrKey} to ${params.accountId || 'no one'}`);
    
    // Call assignIssue instead of callJiraApi
    const result = await assignIssue(
      config,
      params.issueIdOrKey,
      params.accountId || null
    );
    
    // Return result
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: result.success,
      assignee: params.accountId || null,
      message: params.accountId 
        ? `Issue ${params.issueIdOrKey} assigned to user with account ID: ${params.accountId}`
        : `Issue ${params.issueIdOrKey} unassigned`
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error assigning issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed to assign issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerAssignIssueTool = (server: McpServer) => {
  server.tool(
    'assignIssue',
    'Assign a Jira issue to a user',
    assignIssueSchema.shape,
    async (params: AssignIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        const result = await assignIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
            assignee: result.assignee,
            success: result.success,
            message: result.message
          }
        );
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Error while assigning issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 