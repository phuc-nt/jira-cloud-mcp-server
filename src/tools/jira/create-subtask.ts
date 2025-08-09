import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createSubtask');

// Input schema for createSubtask tool
const CreateSubtaskInputSchema = z.object({
  parentKey: z.string().describe('Parent issue key (e.g., PROJ-123)'),
  summary: z.string().describe('Sub-task summary'),
  description: z.string().optional().describe('Sub-task description'),
  priority: z.string().optional().describe('Priority name (e.g., "High", "Medium", "Low")'),
  assignee: z.string().optional().describe('Assignee account ID'),
  reporter: z.string().optional().describe('Reporter account ID'),
  labels: z.array(z.string()).optional().describe('Array of labels'),
  components: z.array(z.string()).optional().describe('Array of component names'),
  fixVersions: z.array(z.string()).optional().describe('Array of fix version names'),
  issueTypeId: z.string().optional().describe('Sub-task issue type ID (if not provided, will use default Sub-task type)'),
  customFields: z.record(z.any()).optional().describe('Additional custom fields as key-value pairs')
});

type CreateSubtaskParams = z.infer<typeof CreateSubtaskInputSchema>;

async function createSubtaskImpl(params: CreateSubtaskParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating Sub-task for parent: ${params.parentKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    headers['Content-Type'] = 'application/json';
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // First, get the parent issue to determine project and validate
    const parentUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.parentKey)}`;
    const parentResponse = await fetch(parentUrl, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!parentResponse.ok) {
      throw new ApiError(ApiErrorType.NOT_FOUND_ERROR, `Parent issue not found: ${params.parentKey}`, parentResponse.status);
    }

    const parentIssue = await parentResponse.json();
    const projectKey = parentIssue.fields.project.key;
    
    // Build the Sub-task creation payload
    const subtaskData: any = {
      fields: {
        project: {
          key: projectKey
        },
        parent: {
          key: params.parentKey
        },
        summary: params.summary,
        issuetype: params.issueTypeId ? {
          id: params.issueTypeId
        } : {
          name: "Sub-task"  // Default sub-task type
        }
      }
    };

    // Add optional fields
    if (params.description) {
      subtaskData.fields.description = {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.description
              }
            ]
          }
        ]
      };
    }

    if (params.priority) {
      subtaskData.fields.priority = { name: params.priority };
    }

    if (params.assignee) {
      subtaskData.fields.assignee = { accountId: params.assignee };
    }

    if (params.reporter) {
      subtaskData.fields.reporter = { accountId: params.reporter };
    }

    if (params.labels && params.labels.length > 0) {
      subtaskData.fields.labels = params.labels;
    }

    if (params.components && params.components.length > 0) {
      subtaskData.fields.components = params.components.map(name => ({ name }));
    }

    if (params.fixVersions && params.fixVersions.length > 0) {
      subtaskData.fields.fixVersions = params.fixVersions.map(name => ({ name }));
    }

    // Add any additional custom fields
    if (params.customFields) {
      Object.assign(subtaskData.fields, params.customFields);
    }
    
    // Call Jira API to create the Sub-task
    const url = `${baseUrl}/rest/api/3/issue`;
    
    const response = await fetch(url, { 
      method: 'POST',
      headers, 
      body: JSON.stringify(subtaskData),
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (create subtask, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const createdSubtask = await response.json();
    
    logger.info(`Successfully created Sub-task: ${createdSubtask.key}`);
    
    return {
      success: true,
      subtask: {
        key: createdSubtask.key,
        id: createdSubtask.id,
        self: createdSubtask.self
      },
      parent: {
        key: params.parentKey,
        id: parentIssue.id,
        summary: parentIssue.fields.summary
      },
      data: createdSubtask,
      message: `Sub-task ${createdSubtask.key} created successfully for parent ${params.parentKey}`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error creating Sub-task for parent ${params.parentKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to create Sub-task: ${error.message}`, 500);
  }
}

/**
 * Create a new Sub-task with parent-child relationship
 */
export const registerCreateSubtaskTool = (server: any) => {
  server.tool(
    'createSubtask',
    'Create a new Sub-task with parent-child relationship and automatic hierarchy setup',
    CreateSubtaskInputSchema.shape,
    async (params: CreateSubtaskParams, context: Record<string, any>) => {
      try {
        const result = await createSubtaskImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error),
                parentKey: params.parentKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
