import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:enhancedGetIssue');

// Enhanced get issue schema with context-aware expansion
export const enhancedGetIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  
  // Context-aware expansion options
  includeEpicDetails: z.boolean().default(false).describe('Include Epic-specific details (color, done status, child issues)'),
  includeStoryDetails: z.boolean().default(false).describe('Include Story-specific details (story points, epic link, sub-tasks)'),
  includeSubtaskDetails: z.boolean().default(false).describe('Include Sub-task-specific details (parent info, position)'),
  includeHierarchy: z.boolean().default(false).describe('Include full Epic→Story→Sub-task hierarchy context'),
  includeProgress: z.boolean().default(false).describe('Include progress tracking (time, story points, completion)'),
  includeTransitions: z.boolean().default(false).describe('Include available workflow transitions'),
  includeComments: z.boolean().default(false).describe('Include recent comments'),
  includeHistory: z.boolean().default(false).describe('Include change history'),
  includeAttachments: z.boolean().default(false).describe('Include attachment information'),
  
  // Smart expansion (auto-detect based on issue type)
  autoExpand: z.boolean().default(true).describe('Automatically expand relevant details based on issue type'),
  
  // Custom field selection
  customFields: z.array(z.string()).optional().describe('Specific custom fields to include (field IDs)'),
  excludeFields: z.array(z.string()).optional().describe('Fields to exclude from response')
});

type EnhancedGetIssueParams = z.infer<typeof enhancedGetIssueSchema>;

/**
 * Detect issue type and determine smart expansion
 */
async function detectIssueTypeAndExpansion(issueKey: string, config: AtlassianConfig): Promise<{issueType: string, smartExpansions: string[]}> {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  // Quick API call to get basic issue info
  const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=issuetype`;
  
  const response = await fetch(url, { 
    method: 'GET',
    headers, 
    credentials: 'omit' 
  });

  if (!response.ok) {
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Cannot detect issue type for ${issueKey}`, response.status);
  }

  const issue = await response.json();
  const issueType = issue.fields?.issuetype?.name || 'Unknown';
  
  // Determine smart expansions based on issue type
  const smartExpansions: string[] = [];
  
  switch (issueType) {
    case 'Epic':
      smartExpansions.push('epicDetails', 'hierarchy', 'progress');
      break;
    case 'Story':
      smartExpansions.push('storyDetails', 'hierarchy', 'progress');
      break;
    case 'Sub-task':
      smartExpansions.push('subtaskDetails', 'hierarchy');
      break;
    default:
      smartExpansions.push('transitions');
      break;
  }
  
  return { issueType, smartExpansions };
}

/**
 * Get Epic-specific details from Agile API
 */
async function getEpicSpecificDetails(issueKey: string, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  try {
    // Epic details from Agile API
    const epicUrl = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(issueKey)}`;
    const epicResponse = await fetch(epicUrl, { method: 'GET', headers, credentials: 'omit' });
    
    let epicDetails = null;
    if (epicResponse.ok) {
      const epic = await epicResponse.json();
      epicDetails = {
        epicName: epic.name,
        epicColor: epic.color?.key || epic.color,
        epicDone: epic.done,
        epicSelf: epic.self
      };
    }
    
    // Get child issues (Stories under this Epic)
    const childIssuesUrl = `${baseUrl}/rest/api/3/search?jql="Epic Link" = "${issueKey}"&fields=key,summary,status,issuetype,customfield_10016&maxResults=50`;
    const childResponse = await fetch(childIssuesUrl, { method: 'GET', headers, credentials: 'omit' });
    
    let childIssues = [];
    if (childResponse.ok) {
      const childData = await childResponse.json();
      childIssues = childData.issues.map((issue: any) => ({
        key: issue.key,
        summary: issue.fields.summary,
        status: issue.fields.status?.name,
        issueType: issue.fields.issuetype?.name,
        storyPoints: issue.fields.customfield_10016 || 0
      }));
    }
    
    // Calculate Epic progress
    const totalStoryPoints = childIssues.reduce((sum: number, issue: any) => sum + (issue.storyPoints || 0), 0);
    const completedStoryPoints = childIssues
      .filter((issue: any) => issue.status === 'Done')
      .reduce((sum: number, issue: any) => sum + (issue.storyPoints || 0), 0);
    
    return {
      epicDetails,
      childIssues,
      epicProgress: {
        totalChildIssues: childIssues.length,
        completedChildIssues: childIssues.filter((issue: any) => issue.status === 'Done').length,
        totalStoryPoints,
        completedStoryPoints,
        progressPercentage: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
      }
    };
  } catch (error) {
    logger.warn(`Failed to get Epic-specific details for ${issueKey}:`, error);
    return { epicDetails: null, childIssues: [], epicProgress: null };
  }
}

/**
 * Get Story-specific details
 */
async function getStorySpecificDetails(issue: any, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  try {
    const storyDetails = {
      storyPoints: issue.fields.customfield_10016 || 0, // Story Points
      epicLink: issue.fields.customfield_10011 || null, // Epic Link
      sprint: issue.fields.customfield_10020 || null, // Sprint
    };
    
    // Get Epic info if Epic Link exists
    let epicInfo = null;
    if (storyDetails.epicLink) {
      try {
        const epicUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(storyDetails.epicLink)}?fields=summary,customfield_10014`;
        const epicResponse = await fetch(epicUrl, { method: 'GET', headers, credentials: 'omit' });
        if (epicResponse.ok) {
          const epic = await epicResponse.json();
          epicInfo = {
            key: storyDetails.epicLink,
            summary: epic.fields.summary,
            epicName: epic.fields.customfield_10014 // Epic Name
          };
        }
      } catch (error) {
        logger.warn(`Failed to get Epic info for Story ${issue.key}:`, error);
      }
    }
    
    // Get sub-tasks details
    const subTasks = issue.fields.subtasks?.map((subtask: any) => ({
      key: subtask.key,
      summary: subtask.fields.summary,
      status: subtask.fields.status?.name,
      assignee: subtask.fields.assignee?.displayName || 'Unassigned'
    })) || [];
    
    return {
      storyDetails,
      epicInfo,
      subTasks,
      storyProgress: {
        totalSubTasks: subTasks.length,
        completedSubTasks: subTasks.filter((subtask: any) => subtask.status === 'Done').length,
        progressPercentage: subTasks.length > 0 ? Math.round((subTasks.filter((subtask: any) => subtask.status === 'Done').length / subTasks.length) * 100) : 100
      }
    };
  } catch (error) {
    logger.warn(`Failed to get Story-specific details for ${issue.key}:`, error);
    return { storyDetails: null, epicInfo: null, subTasks: [], storyProgress: null };
  }
}

/**
 * Get Sub-task specific details
 */
async function getSubtaskSpecificDetails(issue: any, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  try {
    const parentInfo = issue.fields.parent ? {
      key: issue.fields.parent.key,
      summary: issue.fields.parent.fields.summary,
      status: issue.fields.parent.fields.status?.name,
      issueType: issue.fields.parent.fields.issuetype?.name
    } : null;
    
    // Get sibling sub-tasks
    let siblingSubtasks = [];
    if (parentInfo) {
      try {
        const parentUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(parentInfo.key)}?fields=subtasks`;
        const parentResponse = await fetch(parentUrl, { method: 'GET', headers, credentials: 'omit' });
        if (parentResponse.ok) {
          const parent = await parentResponse.json();
          siblingSubtasks = parent.fields.subtasks?.map((subtask: any) => ({
            key: subtask.key,
            summary: subtask.fields.summary,
            status: subtask.fields.status?.name,
            isCurrent: subtask.key === issue.key
          })) || [];
        }
      } catch (error) {
        logger.warn(`Failed to get sibling sub-tasks for ${issue.key}:`, error);
      }
    }
    
    return {
      parentInfo,
      siblingSubtasks,
      position: siblingSubtasks.findIndex((subtask: any) => subtask.isCurrent) + 1,
      totalSiblings: siblingSubtasks.length
    };
  } catch (error) {
    logger.warn(`Failed to get Sub-task-specific details for ${issue.key}:`, error);
    return { parentInfo: null, siblingSubtasks: [], position: 0, totalSiblings: 0 };
  }
}

/**
 * Get additional context data
 */
async function getAdditionalContext(issueKey: string, params: EnhancedGetIssueParams, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  const additionalData: any = {};
  
  try {
    // Get comments if requested
    if (params.includeComments) {
      const commentsUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}/comment?maxResults=10&orderBy=-created`;
      const commentsResponse = await fetch(commentsUrl, { method: 'GET', headers, credentials: 'omit' });
      if (commentsResponse.ok) {
        const commentsData = await commentsResponse.json();
        additionalData.recentComments = commentsData.comments.map((comment: any) => ({
          id: comment.id,
          author: comment.author.displayName,
          body: comment.body.content?.[0]?.content?.[0]?.text || 'Complex content',
          created: comment.created,
          updated: comment.updated
        }));
      }
    }
    
    // Get change history if requested
    if (params.includeHistory) {
      const historyUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?expand=changelog&fields=none`;
      const historyResponse = await fetch(historyUrl, { method: 'GET', headers, credentials: 'omit' });
      if (historyResponse.ok) {
        const historyData = await historyResponse.json();
        additionalData.changeHistory = historyData.changelog?.histories?.slice(0, 10).map((history: any) => ({
          id: history.id,
          author: history.author.displayName,
          created: history.created,
          items: history.items.map((item: any) => ({
            field: item.field,
            from: item.fromString,
            to: item.toString
          }))
        })) || [];
      }
    }
    
    // Get attachments if requested
    if (params.includeAttachments) {
      const attachmentsUrl = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(issueKey)}?fields=attachment`;
      const attachmentsResponse = await fetch(attachmentsUrl, { method: 'GET', headers, credentials: 'omit' });
      if (attachmentsResponse.ok) {
        const attachmentsData = await attachmentsResponse.json();
        additionalData.attachments = attachmentsData.fields.attachment?.map((attachment: any) => ({
          id: attachment.id,
          filename: attachment.filename,
          size: attachment.size,
          mimeType: attachment.mimeType,
          author: attachment.author.displayName,
          created: attachment.created
        })) || [];
      }
    }
    
    return additionalData;
  } catch (error) {
    logger.warn(`Failed to get additional context for ${issueKey}:`, error);
    return additionalData;
  }
}

export async function enhancedGetIssueImpl(params: EnhancedGetIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Enhanced get issue: ${params.issueKey} with expansions`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Detect issue type and smart expansions
    let detectedType = null;
    let smartExpansions: string[] = [];
    
    if (params.autoExpand) {
      const detection = await detectIssueTypeAndExpansion(params.issueKey, config);
      detectedType = detection.issueType;
      smartExpansions = detection.smartExpansions;
    }

    // Build field list for main API call
    const baseFields = [
      'summary', 'description', 'status', 'issuetype', 'project', 'assignee', 'reporter',
      'priority', 'labels', 'components', 'fixVersions', 'created', 'updated', 'duedate',
      'resolution', 'resolutiondate', 'timeoriginalestimate', 'timeestimate', 'timespent',
      'subtasks', 'parent'
    ];
    
    // Add custom fields
    const customFieldMap = {
      'customfield_10016': 'Story Points',
      'customfield_10011': 'Epic Link', 
      'customfield_10014': 'Epic Name',
      'customfield_10020': 'Sprint'
    };
    
    Object.keys(customFieldMap).forEach(field => baseFields.push(field));
    
    if (params.customFields) {
      baseFields.push(...params.customFields);
    }
    
    const expand = [];
    if (params.includeTransitions || smartExpansions.includes('transitions')) {
      expand.push('transitions');
    }
    
    // Main issue API call
    const fieldsParam = baseFields.join(',');
    const expandParam = expand.length > 0 ? `&expand=${expand.join(',')}` : '';
    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}?fields=${fieldsParam}${expandParam}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (enhanced get issue, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const issue = await response.json();
    const issueType = issue.fields.issuetype?.name;
    
    // Build base issue response
    const baseIssue = {
      key: issue.key,
      id: issue.id,
      self: issue.self,
      summary: issue.fields.summary,
      description: issue.fields.description,
      status: {
        name: issue.fields.status?.name,
        category: issue.fields.status?.statusCategory?.name
      },
      issueType: {
        name: issueType,
        iconUrl: issue.fields.issuetype?.iconUrl
      },
      project: {
        key: issue.fields.project?.key,
        name: issue.fields.project?.name
      },
      assignee: issue.fields.assignee ? {
        accountId: issue.fields.assignee.accountId,
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress
      } : null,
      reporter: issue.fields.reporter ? {
        accountId: issue.fields.reporter.accountId,
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress
      } : null,
      priority: {
        name: issue.fields.priority?.name,
        iconUrl: issue.fields.priority?.iconUrl
      },
      labels: issue.fields.labels || [],
      components: issue.fields.components?.map((comp: any) => comp.name) || [],
      fixVersions: issue.fields.fixVersions?.map((version: any) => version.name) || [],
      created: issue.fields.created,
      updated: issue.fields.updated,
      duedate: issue.fields.duedate,
      resolution: issue.fields.resolution?.name,
      resolutiondate: issue.fields.resolutiondate,
      timeTracking: {
        originalEstimate: issue.fields.timeoriginalestimate,
        remainingEstimate: issue.fields.timeestimate,
        timeSpent: issue.fields.timespent
      }
    };
    
    // Enhanced response object
    const enhancedResponse: any = {
      issue: baseIssue,
      detectedIssueType: detectedType || issueType,
      appliedExpansions: [],
      success: true
    };
    
    // Apply type-specific expansions
    if ((params.includeEpicDetails || smartExpansions.includes('epicDetails')) && issueType === 'Epic') {
      const epicData = await getEpicSpecificDetails(params.issueKey, config);
      enhancedResponse.epicData = epicData;
      enhancedResponse.appliedExpansions.push('epicDetails');
    }
    
    if ((params.includeStoryDetails || smartExpansions.includes('storyDetails')) && issueType === 'Story') {
      const storyData = await getStorySpecificDetails(issue, config);
      enhancedResponse.storyData = storyData;
      enhancedResponse.appliedExpansions.push('storyDetails');
    }
    
    if ((params.includeSubtaskDetails || smartExpansions.includes('subtaskDetails')) && issueType === 'Sub-task') {
      const subtaskData = await getSubtaskSpecificDetails(issue, config);
      enhancedResponse.subtaskData = subtaskData;
      enhancedResponse.appliedExpansions.push('subtaskDetails');
    }
    
    // Apply hierarchy expansion
    if (params.includeHierarchy || smartExpansions.includes('hierarchy')) {
      const hierarchy: any = {};
      
      // Parent info
      if (issue.fields.parent) {
        hierarchy.parent = {
          key: issue.fields.parent.key,
          summary: issue.fields.parent.fields.summary,
          issueType: issue.fields.parent.fields.issuetype?.name
        };
      }
      
      // Sub-tasks
      if (issue.fields.subtasks && issue.fields.subtasks.length > 0) {
        hierarchy.subtasks = issue.fields.subtasks.map((subtask: any) => ({
          key: subtask.key,
          summary: subtask.fields.summary,
          status: subtask.fields.status?.name
        }));
      }
      
      // Epic link
      if (issue.fields.customfield_10011) {
        hierarchy.epicLink = {
          key: issue.fields.customfield_10011,
          name: issue.fields.customfield_10014
        };
      }
      
      enhancedResponse.hierarchy = hierarchy;
      enhancedResponse.appliedExpansions.push('hierarchy');
    }
    
    // Apply progress expansion
    if (params.includeProgress || smartExpansions.includes('progress')) {
      const progress: any = {
        storyPoints: issue.fields.customfield_10016 || 0,
        timeTracking: enhancedResponse.issue.timeTracking
      };
      
      if (issue.fields.customfield_10020) {
        progress.sprint = Array.isArray(issue.fields.customfield_10020) 
          ? issue.fields.customfield_10020.map((sprint: any) => ({
              id: sprint.id,
              name: sprint.name,
              state: sprint.state
            }))
          : [{
              id: issue.fields.customfield_10020.id,
              name: issue.fields.customfield_10020.name,
              state: issue.fields.customfield_10020.state
            }];
      }
      
      enhancedResponse.progress = progress;
      enhancedResponse.appliedExpansions.push('progress');
    }
    
    // Apply transitions
    if (params.includeTransitions || smartExpansions.includes('transitions')) {
      enhancedResponse.availableTransitions = issue.transitions?.map((trans: any) => ({
        id: trans.id,
        name: trans.name,
        to: trans.to.name
      })) || [];
      enhancedResponse.appliedExpansions.push('transitions');
    }
    
    // Get additional context
    const additionalData = await getAdditionalContext(params.issueKey, params, config);
    if (Object.keys(additionalData).length > 0) {
      enhancedResponse.additionalContext = additionalData;
      if (additionalData.recentComments) enhancedResponse.appliedExpansions.push('comments');
      if (additionalData.changeHistory) enhancedResponse.appliedExpansions.push('history');
      if (additionalData.attachments) enhancedResponse.appliedExpansions.push('attachments');
    }

    return enhancedResponse;

  } catch (error) {
    logger.error('Error in enhanced get issue:', error);
    throw error;
  }
}

export const registerEnhancedGetIssueTool = (server: McpServer) => {
  server.tool(
    'getIssue',
    'Enhanced issue retrieval with context-aware expansion. Replaces getIssue and getEpic tools with intelligent type detection and comprehensive details.',
    enhancedGetIssueSchema.shape,
    async (params: EnhancedGetIssueParams, context: Record<string, any>) => {
      try {
        const result = await enhancedGetIssueImpl(params, context);
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
