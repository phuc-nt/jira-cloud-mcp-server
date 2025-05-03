import { z } from 'zod';
import { AtlassianConfig, updateIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateIssue');

// Input parameter schema
export const updateIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID or key of the issue to update (e.g., PROJ-123)'),
  summary: z.string().optional().describe('New summary of the issue'),
  description: z.string().optional().describe('New description of the issue'),
  priority: z.string().optional().describe('New priority (e.g., High, Medium, Low)'),
  labels: z.array(z.string()).optional().describe('New labels for the issue'),
  customFields: z.record(z.any()).optional().describe('Custom fields to update')
});

type UpdateIssueParams = z.infer<typeof updateIssueSchema>;

interface UpdateIssueResult {
  issueIdOrKey: string;
  success: boolean;
  message: string;
}

// Helper to create Atlassian Document Format (ADF) from plain text
function textToAdf(text: string) {
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      }
    ]
  };
}

// Main handler to update an issue
export async function updateIssueHandler(
  params: UpdateIssueParams,
  config: AtlassianConfig
): Promise<UpdateIssueResult> {
  try {
    logger.info(`Updating issue: ${params.issueIdOrKey}`);
    
    // Prepare data for API call
    const fields: Record<string, any> = {};
    
    // Add fields to update
    if (params.summary) {
      fields.summary = params.summary;
    }
    
    if (params.description) {
      fields.description = textToAdf(params.description);
    }
    
    if (params.priority) {
      fields.priority = {
        name: params.priority
      };
    }
    
    if (params.labels) {
      fields.labels = params.labels;
    }
    
    // Add custom fields if provided
    if (params.customFields) {
      Object.entries(params.customFields).forEach(([key, value]) => {
        fields[key] = value;
      });
    }
    
    // Check if any field is provided
    if (Object.keys(fields).length === 0) {
      return {
        issueIdOrKey: params.issueIdOrKey,
        success: false,
        message: 'No fields provided to update'
      };
    }
    
    // Call updateIssue instead of callJiraApi
    const result = await updateIssue(
      config,
      params.issueIdOrKey,
      fields
    );
    
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: result.success,
      message: result.message
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error updating issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed to update issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerUpdateIssueTool = (server: McpServer) => {
  server.tool(
    'updateIssue',
    'Update information of a Jira issue',
    updateIssueSchema.shape,
    async (params: UpdateIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        const result = await updateIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
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
          `Error while updating issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 