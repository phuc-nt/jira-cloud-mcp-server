import { z } from 'zod';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { transitionIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:transitionIssue');

// Input parameter schema
export const transitionIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue (e.g., PROJ-123)'),
  transitionId: z.string().describe('ID of the transition to apply'),
  comment: z.string().optional().describe('Comment when performing the transition')
});

type TransitionIssueParams = z.infer<typeof transitionIssueSchema>;

interface TransitionIssueResult {
  issueIdOrKey: string;
  success: boolean;
  transitionId: string;
  message: string;
}

// Main handler to transition an issue
export async function transitionIssueHandler(
  params: TransitionIssueParams,
  config: AtlassianConfig
): Promise<TransitionIssueResult> {
  try {
    logger.info(`Transitioning issue ${params.issueIdOrKey} with transition ${params.transitionId}`);
    
    // Call transitionIssue instead of callJiraApi
    const result = await transitionIssue(
      config,
      params.issueIdOrKey,
      params.transitionId,
      params.comment
    );
    
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: result.success,
      transitionId: params.transitionId,
      message: result.message
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error transitioning issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed to transition issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerTransitionIssueTool = (server: McpServer) => {
  server.tool(
    'transitionIssue',
    'Transition the status of a Jira issue',
    transitionIssueSchema.shape,
    async (params: TransitionIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        const result = await transitionIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
            transitionId: result.transitionId,
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
          `Error while transitioning issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 