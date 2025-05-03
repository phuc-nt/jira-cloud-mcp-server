import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { JiraIssueType } from '../../utils/jira-interfaces.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createIssue');

// Input parameter schema
export const createIssueSchema = z.object({
  projectKey: z.string().describe('Project key (e.g., PROJ)'),
  summary: z.string().describe('Issue summary'),
  issueType: z.string().default('Task').describe('Issue type (e.g., Bug, Task, Story)'),
  description: z.string().optional().describe('Issue description'),
  priority: z.string().optional().describe('Priority (e.g., High, Medium, Low)'),
  assignee: z.string().optional().describe('Assignee username'),
  labels: z.array(z.string()).optional().describe('Labels for the issue')
});

type CreateIssueParams = z.infer<typeof createIssueSchema>;

interface CreateIssueResult {
  id: string;
  key: string;
  self: string;
  success: boolean;
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

// Main handler to create a new issue
export async function createIssueHandler(
  params: CreateIssueParams,
  config: AtlassianConfig
): Promise<CreateIssueResult> {
  try {
    logger.info(`Creating new issue in project: ${params.projectKey}`);
    
    // Build additionalFields from optional parameters
    const additionalFields: Record<string, any> = {};
    
    // Add priority if provided
    if (params.priority) {
      additionalFields.priority = {
        name: params.priority
      };
    }
    
    // Add assignee if provided
    if (params.assignee) {
      additionalFields.assignee = {
        name: params.assignee
      };
    }
    
    // Add labels if provided
    if (params.labels && params.labels.length > 0) {
      additionalFields.labels = params.labels;
    }
    
    // Call createIssue instead of callJiraApi
    const newIssue = await createIssue(
      config,
      params.projectKey,
      params.summary,
      params.description,
      params.issueType,
      additionalFields
    );
    
    // Return result
    return {
      id: newIssue.id,
      key: newIssue.key,
      self: newIssue.self,
      success: true
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error creating issue in project ${params.projectKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Failed to create issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerCreateIssueTool = (server: McpServer) => {
  server.tool(
    'createIssue',
    'Create a new issue in Jira',
    createIssueSchema.shape,
    async (params: CreateIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        // Create new issue
        const result = await createIssueHandler(params, config);
        
        // Return MCP-compliant response
        return createTextResponse(
          `Issue created successfully: ${result.key}`,
          {
            id: result.id,
            key: result.key,
            self: result.self,
            success: result.success
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
          `Error while creating issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 