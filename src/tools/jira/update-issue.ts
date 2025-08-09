import { z } from 'zod';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { updateIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

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
  // Note: Fix Version assignment temporarily disabled due to screen configuration issues
});

type UpdateIssueParams = z.infer<typeof updateIssueSchema>;

async function updateIssueToolImpl(params: UpdateIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Updating issue: ${params.issueIdOrKey}`);
  const fields: Record<string, any> = {};
  if (params.summary) {
    fields.summary = params.summary;
  }
  if (params.description) {
    fields.description = {
      version: 1,
      type: 'doc',
      content: [
        {
          type: 'paragraph',
          content: [
            {
              type: 'text',
              text: params.description
            }
          ]
        }
      ]
    };
  }
  if (params.priority) {
    fields.priority = { name: params.priority };
  }
  if (params.labels) {
    fields.labels = params.labels;
  }
  if (params.customFields) {
    Object.entries(params.customFields).forEach(([key, value]) => {
      fields[key] = value;
    });
  }
  
  // Check if we have fields to update
  const hasFieldsToUpdate = Object.keys(fields).length > 0;
  
  if (!hasFieldsToUpdate) {
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: false,
      message: 'No fields provided to update'
    };
  }
  
  // Use the existing updateIssue function for field updates
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
}

export const registerUpdateIssueTool = (server: McpServer) => {
  server.tool(
    'updateIssue',
    'Update information of a Jira issue',
    updateIssueSchema.shape,
    async (params: UpdateIssueParams, context: Record<string, any>) => {
      try {
        const result = await updateIssueToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ success: false, error: error instanceof Error ? error.message : String(error) })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 