import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { createIssue } from '../../utils/jira-tool-api-v3.js';
import { ApiError } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Tools, Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:createIssue');

// Enhanced input parameter schema with intelligent type detection
export const createIssueSchema = z.object({
  projectKey: z.string().describe('Project key (e.g., PROJ)'),
  summary: z.string().describe('Issue summary'),
  issueType: z.string().optional().describe('Issue type (Task, Bug, Story, Epic, Sub-task). Auto-detected if not provided.'),
  description: z.string().optional().describe('Issue description'),
  priority: z.string().optional().describe('Priority (e.g., High, Medium, Low)'),
  assignee: z.string().optional().describe('Assignee username'),
  labels: z.array(z.string()).optional().describe('Labels for the issue'),
  
  // Epic-specific fields (auto-detects Epic type)
  epicName: z.string().optional().describe('Epic name (automatically sets issueType to Epic)'),
  epicColor: z.string().optional().describe('Epic color (Blue, Green, Yellow, Orange, Red, Purple)'),
  
  // Story-specific fields (auto-detects Story type)
  epicKey: z.string().optional().describe('Parent Epic key (automatically sets issueType to Story)'),
  storyPoints: z.number().optional().describe('Story points estimation'),
  
  // Sub-task specific fields (auto-detects Sub-task type)
  parentKey: z.string().optional().describe('Parent issue key (automatically sets issueType to Sub-task)'),
  
  // Additional fields
  components: z.array(z.string()).optional().describe('Component names'),
  fixVersions: z.array(z.string()).optional().describe('Fix version names'),
  reporter: z.string().optional().describe('Reporter username'),
  environment: z.string().optional().describe('Environment description'),
  dueDate: z.string().optional().describe('Due date (YYYY-MM-DD format)')
});

type CreateIssueParams = z.infer<typeof createIssueSchema>;

/**
 * Intelligent issue type detection based on provided parameters
 */
function detectIssueType(params: CreateIssueParams): string {
  // Explicit type provided
  if (params.issueType) {
    return params.issueType;
  }
  
  // Auto-detection logic
  if (params.epicName) {
    logger.info('Auto-detected issue type: Epic (epicName provided)');
    return 'Epic';
  }
  
  if (params.parentKey) {
    logger.info('Auto-detected issue type: Sub-task (parentKey provided)');
    return 'Sub-task';
  }
  
  if (params.epicKey || params.storyPoints) {
    logger.info('Auto-detected issue type: Story (epicKey or storyPoints provided)');
    return 'Story';
  }
  
  // Default to Task
  logger.info('Using default issue type: Task');
  return 'Task';
}

/**
 * Build additional fields based on issue type and parameters
 */
function buildAdditionalFields(params: CreateIssueParams, detectedType: string): Record<string, any> {
  const additionalFields: Record<string, any> = {};
  
  // Common fields
  if (params.priority) {
    additionalFields.priority = { name: params.priority };
  }
  
  if (params.assignee) {
    additionalFields.assignee = { name: params.assignee };
  }
  
  if (params.reporter) {
    additionalFields.reporter = { name: params.reporter };
  }
  
  if (params.labels && params.labels.length > 0) {
    additionalFields.labels = params.labels;
  }
  
  if (params.components && params.components.length > 0) {
    additionalFields.components = params.components.map(name => ({ name }));
  }
  
  if (params.fixVersions && params.fixVersions.length > 0) {
    additionalFields.fixVersions = params.fixVersions.map(name => ({ name }));
  }
  
  if (params.environment) {
    additionalFields.environment = params.environment;
  }
  
  if (params.dueDate) {
    additionalFields.duedate = params.dueDate;
  }
  
  // Issue type specific fields
  switch (detectedType) {
    case 'Epic':
      if (params.epicName) {
        additionalFields.customfield_10011 = params.epicName; // Epic Name field
      }
      if (params.epicColor) {
        additionalFields.customfield_10013 = params.epicColor; // Epic Color field
      }
      break;
      
    case 'Story':
      if (params.epicKey) {
        additionalFields.customfield_10014 = params.epicKey; // Epic Link field
      }
      if (params.storyPoints) {
        additionalFields.customfield_10016 = params.storyPoints; // Story Points field
      }
      break;
      
    case 'Sub-task':
      if (params.parentKey) {
        additionalFields.parent = { key: params.parentKey };
      }
      break;
  }
  
  return additionalFields;
}

async function createIssueToolImpl(params: CreateIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  
  // Intelligent type detection
  const detectedType = detectIssueType(params);
  logger.info(`Creating ${detectedType} in project: ${params.projectKey}`);
  
  // Build additional fields based on type and parameters
  const additionalFields = buildAdditionalFields(params, detectedType);
  
  // Log enhanced creation details
  logger.info(`Enhanced createIssue - Type: ${detectedType}, Fields: ${Object.keys(additionalFields).length}`);
  
  const newIssue = await createIssue(
    config,
    params.projectKey,
    params.summary,
    params.description,
    detectedType,
    additionalFields
  );
  
  return {
    id: newIssue.id,
    key: newIssue.key,
    self: newIssue.self,
    issueType: detectedType,
    detectedFromParams: !params.issueType, // Indicates if type was auto-detected
    success: true
  };
}

export function registerCreateIssueTool(server: McpServer) {
  Tools.register(server, {
    name: 'createIssue',
    description: `Enhanced universal issue creation with intelligent type detection.
    
    🎯 SMART FEATURES:
    • Auto-detects issue type from parameters (Epic, Story, Sub-task, Task)
    • Epic detection: Provide 'epicName' → automatically creates Epic
    • Story detection: Provide 'epicKey' or 'storyPoints' → automatically creates Story  
    • Sub-task detection: Provide 'parentKey' → automatically creates Sub-task
    • Supports all Jira issue types with type-specific fields
    
    💡 USAGE PATTERNS:
    Epic: { projectKey, summary, epicName, epicColor }
    Story: { projectKey, summary, epicKey, storyPoints }
    Sub-task: { projectKey, summary, parentKey }
    Task/Bug: { projectKey, summary, issueType }
    
    🔧 ENHANCED FIELDS:
    • Epic: epicName, epicColor
    • Story: epicKey, storyPoints  
    • Sub-task: parentKey
    • All: priority, assignee, labels, components, fixVersions, dueDate`,
    inputSchema: createIssueSchema,
    handler: createIssueToolImpl
  });
} 