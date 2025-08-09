import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createBulkSubtasks');

// Sub-task item schema
const SubtaskItemSchema = z.object({
  summary: z.string().describe('Sub-task summary'),
  description: z.string().optional().describe('Sub-task description'),
  priority: z.string().optional().describe('Priority name (e.g., "High", "Medium", "Low")'),
  assignee: z.string().optional().describe('Assignee account ID'),
  labels: z.array(z.string()).optional().describe('Array of labels'),
  customFields: z.record(z.any()).optional().describe('Additional custom fields as key-value pairs')
});

// Input schema for createBulkSubtasks tool
const CreateBulkSubtasksInputSchema = z.object({
  parentKey: z.string().describe('Parent issue key (e.g., PROJ-123)'),
  subtasks: z.array(SubtaskItemSchema).min(1).max(50).describe('Array of sub-tasks to create (max 50)'),
  issueTypeId: z.string().optional().describe('Sub-task issue type ID (if not provided, will use default Sub-task type)'),
  defaultPriority: z.string().optional().describe('Default priority for all sub-tasks'),
  defaultAssignee: z.string().optional().describe('Default assignee account ID for all sub-tasks'),
  defaultLabels: z.array(z.string()).optional().describe('Default labels for all sub-tasks'),
  components: z.array(z.string()).optional().describe('Array of component names for all sub-tasks'),
  fixVersions: z.array(z.string()).optional().describe('Array of fix version names for all sub-tasks')
});

type CreateBulkSubtasksParams = z.infer<typeof CreateBulkSubtasksInputSchema>;

async function createBulkSubtasksImpl(params: CreateBulkSubtasksParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Creating ${params.subtasks.length} Sub-tasks for parent: ${params.parentKey}`);

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
    
    // Build the bulk creation payload
    const bulkData = {
      issueUpdates: params.subtasks.map((subtask, index) => ({
        fields: {
          project: {
            key: projectKey
          },
          parent: {
            key: params.parentKey
          },
          summary: subtask.summary,
          issuetype: params.issueTypeId ? {
            id: params.issueTypeId
          } : {
            name: "Sub-task"  // Default sub-task type
          },
          // Merge default and specific values for each sub-task
          ...(subtask.description && {
            description: {
              type: "doc",
              version: 1,
              content: [
                {
                  type: "paragraph",
                  content: [
                    {
                      type: "text",
                      text: subtask.description
                    }
                  ]
                }
              ]
            }
          }),
          ...(( subtask.priority || params.defaultPriority) && {
            priority: { name: subtask.priority || params.defaultPriority }
          }),
          ...((subtask.assignee || params.defaultAssignee) && {
            assignee: { accountId: subtask.assignee || params.defaultAssignee }
          }),
          // Combine default and specific labels
          ...((subtask.labels?.length || params.defaultLabels?.length) && {
            labels: [
              ...(params.defaultLabels || []),
              ...(subtask.labels || [])
            ]
          }),
          // Add components if provided
          ...(params.components?.length && {
            components: params.components.map(name => ({ name }))
          }),
          // Add fix versions if provided
          ...(params.fixVersions?.length && {
            fixVersions: params.fixVersions.map(name => ({ name }))
          }),
          // Add custom fields if provided
          ...(subtask.customFields || {})
        }
      }))
    };
    
    // Call Jira API to create the Sub-tasks in bulk
    const url = `${baseUrl}/rest/api/3/issue/bulk`;
    
    const response = await fetch(url, { 
      method: 'POST',
      headers, 
      body: JSON.stringify(bulkData),
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (create bulk subtasks, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format successful and failed creations
    const successful = result.issues || [];
    const errors = result.errors || [];
    
    logger.info(`Successfully created ${successful.length} Sub-tasks, ${errors.length} failed`);
    
    return {
      success: true,
      parent: {
        key: params.parentKey,
        id: parentIssue.id,
        summary: parentIssue.fields.summary
      },
      subtasksCreated: successful.length,
      subtasksFailed: errors.length,
      subtasks: successful.map((subtask: any) => ({
        key: subtask.key,
        id: subtask.id,
        self: subtask.self
      })),
      errors: errors.map((error: any, index: number) => ({
        index,
        summary: params.subtasks[error.elementErrors?.issueUpdates || index]?.summary || 'Unknown',
        errors: error.elementErrors || error.errors || [error.errorMessage || 'Unknown error']
      })),
      message: `Created ${successful.length} Sub-tasks for parent ${params.parentKey}${errors.length > 0 ? ` (${errors.length} failed)` : ''}`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error creating bulk Sub-tasks for parent ${params.parentKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to create bulk Sub-tasks: ${error.message}`, 500);
  }
}

/**
 * Create multiple Sub-tasks for a parent issue using bulk operations
 */
export const registerCreateBulkSubtasksTool = (server: any) => {
  server.tool(
    'createBulkSubtasks',
    'Create multiple Sub-tasks for a parent issue using bulk operations with template-based generation',
    CreateBulkSubtasksInputSchema.shape,
    async (params: CreateBulkSubtasksParams, context: Record<string, any>) => {
      try {
        const result = await createBulkSubtasksImpl(params, context);
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
