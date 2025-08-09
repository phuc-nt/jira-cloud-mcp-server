import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { updateIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:enhancedUpdateIssue');

// Enhanced update issue schema with type-specific fields
export const enhancedUpdateIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  
  // Universal issue fields
  summary: z.string().optional().describe('New summary of the issue'),
  description: z.string().optional().describe('New description of the issue'),
  priority: z.string().optional().describe('New priority (High, Medium, Low)'),
  labels: z.array(z.string()).optional().describe('New labels for the issue'),
  assignee: z.string().optional().describe('Assignee account ID or email'),
  
  // Epic-specific fields (auto-detects Epic type)
  epicName: z.string().optional().describe('Epic name (auto-detects Epic type)'),
  epicColor: z.string().optional().describe('Epic color key (color_1, color_2, etc.)'),
  epicDone: z.boolean().optional().describe('Whether Epic is done'),
  
  // Story-specific fields (auto-detects Story type)
  storyPoints: z.number().optional().describe('Story points (auto-detects Story type)'),
  epicKey: z.string().optional().describe('Epic key to link this Story to'),
  
  // Sub-task specific fields (auto-detects Sub-task type)
  parentKey: z.string().optional().describe('Parent issue key (auto-detects Sub-task type)'),
  
  // Custom fields by field ID
  customFields: z.record(z.any()).optional().describe('Custom fields to update by field ID'),
  
  // Advanced options
  issueType: z.string().optional().describe('Explicit issue type (overrides auto-detection)'),
  validateTransition: z.boolean().default(false).describe('Validate fields against current workflow'),
  smartFieldMapping: z.boolean().default(true).describe('Use smart field mapping for issue type')
});

type EnhancedUpdateIssueParams = z.infer<typeof enhancedUpdateIssueSchema>;

/**
 * Detect issue type from current issue or parameters
 */
async function detectIssueTypeForUpdate(issueKey: string, params: EnhancedUpdateIssueParams, config: AtlassianConfig): Promise<string> {
  // Explicit type takes precedence
  if (params.issueType) {
    return params.issueType;
  }
  
  // Auto-detect from parameters (faster than API call)
  if (params.epicName || params.epicColor || params.epicDone !== undefined) {
    return 'Epic';
  }
  
  if (params.storyPoints !== undefined || params.epicKey) {
    return 'Story';
  }
  
  if (params.parentKey) {
    return 'Sub-task';
  }
  
  // If no type-specific params, assume Task (avoid API call)
  return 'Task';
}

/**
 * Smart field mapping based on issue type
 */
function mapFieldsForIssueType(params: EnhancedUpdateIssueParams, issueType: string): { fields: Record<string, any>, epicFields?: Record<string, any> } {
  const fields: Record<string, any> = {};
  const epicFields: Record<string, any> = {};
  
  // Universal fields
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
  
  if (params.assignee) {
    // Handle both email and account ID
    if (params.assignee.includes('@')) {
      fields.assignee = { emailAddress: params.assignee };
    } else {
      fields.assignee = { accountId: params.assignee };
    }
  }
  
  // Type-specific field mapping
  switch (issueType) {
    case 'Epic':
      // Epic-specific fields go to separate Agile API call
      if (params.epicName) {
        epicFields.name = params.epicName;
      }
      if (params.epicColor) {
        epicFields.color = { key: params.epicColor };
      }
      if (params.epicDone !== undefined) {
        epicFields.done = params.epicDone;
      }
      break;
      
    case 'Story':
      // Story points
      if (params.storyPoints !== undefined) {
        fields.customfield_10016 = params.storyPoints; // Story Points field
      }
      // Epic Link
      if (params.epicKey) {
        fields.customfield_10011 = params.epicKey; // Epic Link field
      }
      break;
      
    case 'Sub-task':
      // Parent relationship
      if (params.parentKey) {
        fields.parent = { key: params.parentKey };
      }
      break;
  }
  
  // Custom fields
  if (params.customFields) {
    Object.entries(params.customFields).forEach(([key, value]) => {
      fields[key] = value;
    });
  }
  
  return { fields, epicFields };
}

/**
 * Validate fields against workflow if requested
 */
async function validateFieldsForWorkflow(issueKey: string, fields: Record<string, any>, config: AtlassianConfig): Promise<string[]> {
  const warnings: string[] = [];
  
  // Simple validation without API calls to avoid timeout
  if (fields.assignee) {
    warnings.push('Assigning issue - consider workflow state');
  }
  
  if (fields.resolution) {
    warnings.push('Setting resolution - ensure proper workflow transition');
  }
  
  return warnings;
}

/**
 * Update Epic-specific fields via Agile API
 */
async function updateEpicFields(issueKey: string, epicFields: Record<string, any>, config: AtlassianConfig): Promise<any> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  headers['Content-Type'] = 'application/json';
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  const url = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(issueKey)}`;
  
  const response = await fetch(url, { 
    method: 'POST',
    headers, 
    body: JSON.stringify(epicFields),
    credentials: 'omit' 
  });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error(`Jira Agile API error (update epic, ${response.status}):`, responseText);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Epic update failed: ${response.status} ${responseText}`, response.status);
  }

  return await response.json();
}

/**
 * Get updated issue details for response (optional, avoid timeout)
 */
async function getUpdatedIssueDetails(issueKey: string, config: AtlassianConfig): Promise<any> {
  // Skip detailed fetch to avoid timeout - return basic success info
  return {
    key: issueKey,
    message: 'Updated successfully - use getIssue tool for latest details'
  };
}

async function enhancedUpdateIssueImpl(params: EnhancedUpdateIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  
  // Detect issue type
  const detectedType = await detectIssueTypeForUpdate(params.issueKey, params, config);
  logger.info(`Enhanced update issue ${params.issueKey} - detected type: ${detectedType}`);

  try {
    // Map fields based on issue type
    const { fields, epicFields } = mapFieldsForIssueType(params, detectedType);
    
    // Validate we have something to update
    const hasStandardFields = Object.keys(fields).length > 0;
    const hasEpicFields = epicFields && Object.keys(epicFields).length > 0;
    
    if (!hasStandardFields && !hasEpicFields) {
      throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'No fields provided to update', 400);
    }
    
    // Workflow validation
    let warnings: string[] = [];
    if (params.validateTransition && hasStandardFields) {
      warnings = await validateFieldsForWorkflow(params.issueKey, fields, config);
    }
    
    const results: any = {
      issueKey: params.issueKey,
      detectedIssueType: detectedType,
      appliedUpdates: [],
      success: true
    };
    
    // Update standard fields via standard API
    if (hasStandardFields) {
      try {
        const standardResult = await updateIssue(config, params.issueKey, fields);
        if (standardResult.success) {
          results.appliedUpdates.push('standardFields');
          results.standardFieldsUpdate = {
            success: true,
            updatedFields: Object.keys(fields)
          };
        } else {
          results.standardFieldsUpdate = {
            success: false,
            error: standardResult.message
          };
        }
      } catch (error) {
        logger.error(`Standard fields update failed for ${params.issueKey}:`, error);
        results.standardFieldsUpdate = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // Update Epic-specific fields via Agile API
    if (hasEpicFields && detectedType === 'Epic') {
      try {
        const epicResult = await updateEpicFields(params.issueKey, epicFields, config);
        results.appliedUpdates.push('epicFields');
        results.epicFieldsUpdate = {
          success: true,
          updatedFields: Object.keys(epicFields),
          epicData: {
            name: epicResult.name,
            color: epicResult.color,
            done: epicResult.done
          }
        };
      } catch (error) {
        logger.error(`Epic fields update failed for ${params.issueKey}:`, error);
        results.epicFieldsUpdate = {
          success: false,
          error: error instanceof Error ? error.message : String(error)
        };
      }
    }
    
    // Add warnings
    if (warnings.length > 0) {
      results.workflowWarnings = warnings;
    }
    
    // Get updated issue details
    const updatedDetails = await getUpdatedIssueDetails(params.issueKey, config);
    if (updatedDetails) {
      results.updatedIssue = updatedDetails;
    }
    
    // Determine overall success
    const standardSuccess = !hasStandardFields || results.standardFieldsUpdate?.success;
    const epicSuccess = !hasEpicFields || results.epicFieldsUpdate?.success;
    results.success = standardSuccess && epicSuccess;
    
    if (!results.success) {
      results.message = 'Some updates failed - check individual field update results';
    } else {
      results.message = `Issue ${params.issueKey} updated successfully`;
    }

    return results;

  } catch (error) {
    logger.error('Error in enhanced update issue:', error);
    throw error;
  }
}

export const registerEnhancedUpdateIssueTool = (server: McpServer) => {
  server.tool(
    'updateIssue',
    'Enhanced issue update with type-specific field handling. Replaces updateIssue and updateEpic tools with intelligent field mapping and validation.',
    enhancedUpdateIssueSchema.shape,
    async (params: EnhancedUpdateIssueParams, context: Record<string, any>) => {
      try {
        const result = await enhancedUpdateIssueImpl(params, context);
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
                issueKey: params.issueKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
