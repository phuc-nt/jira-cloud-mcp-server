import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:enhancedSearchIssues');

// Smart filter schema for enhanced search
export const enhancedSearchIssuesSchema = z.object({
  // Core search parameters
  projectKey: z.string().optional().describe('Project key to search within (e.g., XDEMO2)'),
  
  // Issue type filtering - auto-detects based on parameters
  issueType: z.string().optional().describe('Specific issue type (Epic, Story, Task, Bug, Sub-task)'),
  
  // Smart type-specific filtering
  epicName: z.string().optional().describe('Epic name to search for (auto-detects Epic type)'),
  epicKey: z.string().optional().describe('Epic key to find Stories under this Epic'),
  epicStatus: z.string().optional().describe('Epic status filter (To Do, In Progress, Done)'),
  
  storyPoints: z.number().optional().describe('Story points filter (auto-detects Story type)'),
  storyPointsMin: z.number().optional().describe('Minimum story points range'),
  storyPointsMax: z.number().optional().describe('Maximum story points range'),
  
  parentKey: z.string().optional().describe('Parent issue key to find Sub-tasks (auto-detects Sub-task type)'),
  
  // General filtering
  status: z.string().optional().describe('Issue status filter'),
  assignee: z.string().optional().describe('Assignee account ID or email'),
  priority: z.string().optional().describe('Priority filter (High, Medium, Low)'),
  summary: z.string().optional().describe('Text to search in summary'),
  description: z.string().optional().describe('Text to search in description'),
  labels: z.array(z.string()).optional().describe('Labels to filter by'),
  components: z.array(z.string()).optional().describe('Components to filter by'),
  
  // Date filtering
  createdAfter: z.string().optional().describe('Issues created after date (YYYY-MM-DD)'),
  createdBefore: z.string().optional().describe('Issues created before date (YYYY-MM-DD)'),
  updatedAfter: z.string().optional().describe('Issues updated after date (YYYY-MM-DD)'),
  updatedBefore: z.string().optional().describe('Issues updated before date (YYYY-MM-DD)'),
  
  // Sprint filtering  
  sprintId: z.string().optional().describe('Sprint ID to filter by'),
  sprintState: z.string().optional().describe('Sprint state (active, future, closed)'),
  
  // Advanced options
  jql: z.string().optional().describe('Custom JQL query (overrides smart filters)'),
  quickFilter: z.enum(['my-issues', 'recent', 'unresolved', 'recently-updated']).optional().describe('Quick filter shortcuts'),
  
  // Pagination
  maxResults: z.number().default(50).describe('Maximum number of results (default: 50)'),
  startAt: z.number().default(0).describe('Starting index for pagination (default: 0)'),
  
  // Response configuration
  fields: z.string().optional().describe('Comma-separated list of fields to include'),
  includeHierarchy: z.boolean().default(false).describe('Include Epic/Story/Sub-task hierarchy info'),
  includeProgress: z.boolean().default(false).describe('Include progress tracking info')
});

type EnhancedSearchIssuesParams = z.infer<typeof enhancedSearchIssuesSchema>;

/**
 * Smart issue type detection based on parameters
 */
function detectSearchIssueType(params: EnhancedSearchIssuesParams): string | null {
  // Explicit type takes precedence
  if (params.issueType) {
    return params.issueType;
  }
  
  // Auto-detect from parameters
  if (params.epicName || params.epicStatus) {
    return 'Epic';
  }
  
  if (params.storyPoints || params.storyPointsMin || params.storyPointsMax || params.epicKey) {
    return 'Story';
  }
  
  if (params.parentKey) {
    return 'Sub-task';
  }
  
  return null; // No specific type detected
}

/**
 * Build smart JQL query from parameters
 */
function buildSmartJQL(params: EnhancedSearchIssuesParams): string {
  // Use custom JQL if provided
  if (params.jql) {
    return params.jql;
  }
  
  const jqlParts: string[] = [];
  
  // Project filter
  if (params.projectKey) {
    jqlParts.push(`project = "${params.projectKey}"`);
  }
  
  // Smart issue type detection
  const detectedType = detectSearchIssueType(params);
  if (detectedType) {
    jqlParts.push(`issuetype = "${detectedType}"`);
  }
  
  // Epic-specific filters
  if (params.epicName) {
    jqlParts.push(`"Epic Name" ~ "${params.epicName}"`);
  }
  
  if (params.epicKey) {
    jqlParts.push(`"Epic Link" = "${params.epicKey}"`);
  }
  
  if (params.epicStatus) {
    jqlParts.push(`"Epic Status" = "${params.epicStatus}"`);
  }
  
  // Story points filters
  if (params.storyPoints) {
    jqlParts.push(`"Story Points" = ${params.storyPoints}`);
  }
  
  if (params.storyPointsMin && params.storyPointsMax) {
    jqlParts.push(`"Story Points" >= ${params.storyPointsMin} AND "Story Points" <= ${params.storyPointsMax}`);
  } else if (params.storyPointsMin) {
    jqlParts.push(`"Story Points" >= ${params.storyPointsMin}`);
  } else if (params.storyPointsMax) {
    jqlParts.push(`"Story Points" <= ${params.storyPointsMax}`);
  }
  
  // Sub-task parent filter
  if (params.parentKey) {
    jqlParts.push(`parent = "${params.parentKey}"`);
  }
  
  // General filters
  if (params.status) {
    jqlParts.push(`status = "${params.status}"`);
  }
  
  if (params.assignee) {
    // Handle both email and account ID
    if (params.assignee.includes('@')) {
      jqlParts.push(`assignee = "${params.assignee}"`);
    } else {
      jqlParts.push(`assignee = "${params.assignee}"`);
    }
  }
  
  if (params.priority) {
    jqlParts.push(`priority = "${params.priority}"`);
  }
  
  if (params.summary) {
    jqlParts.push(`summary ~ "${params.summary}"`);
  }
  
  if (params.description) {
    jqlParts.push(`description ~ "${params.description}"`);
  }
  
  // Labels filter
  if (params.labels && params.labels.length > 0) {
    const labelFilters = params.labels.map(label => `labels = "${label}"`);
    jqlParts.push(`(${labelFilters.join(' OR ')})`);
  }
  
  // Components filter
  if (params.components && params.components.length > 0) {
    const componentFilters = params.components.map(comp => `component = "${comp}"`);
    jqlParts.push(`(${componentFilters.join(' OR ')})`);
  }
  
  // Date filters
  if (params.createdAfter) {
    jqlParts.push(`created >= "${params.createdAfter}"`);
  }
  
  if (params.createdBefore) {
    jqlParts.push(`created <= "${params.createdBefore}"`);
  }
  
  if (params.updatedAfter) {
    jqlParts.push(`updated >= "${params.updatedAfter}"`);
  }
  
  if (params.updatedBefore) {
    jqlParts.push(`updated <= "${params.updatedBefore}"`);
  }
  
  // Sprint filters
  if (params.sprintId) {
    jqlParts.push(`sprint = ${params.sprintId}`);
  }
  
  if (params.sprintState) {
    if (params.sprintState === 'active') {
      jqlParts.push(`sprint in openSprints()`);
    } else if (params.sprintState === 'future') {
      jqlParts.push(`sprint in futureSprints()`);
    } else if (params.sprintState === 'closed') {
      jqlParts.push(`sprint in closedSprints()`);
    }
  }
  
  // Quick filters
  if (params.quickFilter) {
    switch (params.quickFilter) {
      case 'my-issues':
        jqlParts.push('assignee = currentUser()');
        break;
      case 'recent':
        jqlParts.push('created >= -7d');
        break;
      case 'unresolved':
        jqlParts.push('resolution = Unresolved');
        break;
      case 'recently-updated':
        jqlParts.push('updated >= -3d');
        break;
    }
  }
  
  // Default JQL if no filters
  if (jqlParts.length === 0) {
    return 'ORDER BY created DESC';
  } else {
    return jqlParts.join(' AND ') + ' ORDER BY created DESC';
  }
}

/**
 * Enhanced issue formatting with hierarchy and progress info
 */
function formatEnhancedIssue(issue: any, includeHierarchy: boolean, includeProgress: boolean) {
  const baseIssue = {
    key: issue.key,
    id: issue.id,
    summary: issue.fields.summary,
    description: issue.fields.description ? 
      (issue.fields.description.length > 200 ? 
        issue.fields.description.substring(0, 200) + '...' : 
        issue.fields.description) : null,
    status: {
      name: issue.fields.status?.name,
      category: issue.fields.status?.statusCategory?.name
    },
    assignee: issue.fields.assignee ? {
      accountId: issue.fields.assignee.accountId,
      displayName: issue.fields.assignee.displayName
    } : null,
    priority: issue.fields.priority?.name,
    issueType: issue.fields.issuetype?.name,
    project: {
      key: issue.fields.project?.key,
      name: issue.fields.project?.name
    },
    created: issue.fields.created,
    updated: issue.fields.updated,
    labels: issue.fields.labels || [],
    components: issue.fields.components?.map((comp: any) => comp.name) || []
  };
  
  // Add hierarchy information
  if (includeHierarchy) {
    const hierarchy: any = {};
    
    // Epic information
    if (issue.fields.customfield_10011) { // Epic Link
      hierarchy.epicKey = issue.fields.customfield_10011;
    }
    
    if (issue.fields.customfield_10014) { // Epic Name
      hierarchy.epicName = issue.fields.customfield_10014;
    }
    
    // Parent/Sub-task information
    if (issue.fields.parent) {
      hierarchy.parentKey = issue.fields.parent.key;
      hierarchy.parentSummary = issue.fields.parent.fields?.summary;
    }
    
    // Sub-tasks
    if (issue.fields.subtasks && issue.fields.subtasks.length > 0) {
      hierarchy.subtasks = issue.fields.subtasks.map((subtask: any) => ({
        key: subtask.key,
        summary: subtask.fields?.summary,
        status: subtask.fields?.status?.name
      }));
    }
    
    if (Object.keys(hierarchy).length > 0) {
      (baseIssue as any).hierarchy = hierarchy;
    }
  }
  
  // Add progress information
  if (includeProgress) {
    const progress: any = {};
    
    // Story points
    if (issue.fields.customfield_10016) { // Story Points
      progress.storyPoints = issue.fields.customfield_10016;
    }
    
    // Sprint information
    if (issue.fields.customfield_10020) { // Sprint
      const sprints = Array.isArray(issue.fields.customfield_10020) 
        ? issue.fields.customfield_10020 
        : [issue.fields.customfield_10020];
      progress.sprints = sprints.map((sprint: any) => ({
        id: sprint.id,
        name: sprint.name,
        state: sprint.state
      }));
    }
    
    // Time tracking
    if (issue.fields.timetracking) {
      progress.timeTracking = {
        originalEstimate: issue.fields.timetracking.originalEstimate,
        remainingEstimate: issue.fields.timetracking.remainingEstimate,
        timeSpent: issue.fields.timetracking.timeSpent
      };
    }
    
    if (Object.keys(progress).length > 0) {
      (baseIssue as any).progress = progress;
    }
  }
  
  return baseIssue;
}

async function enhancedSearchIssuesImpl(params: EnhancedSearchIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  
  // Build smart JQL
  const jqlQuery = buildSmartJQL(params);
  const detectedType = detectSearchIssueType(params);
  
  logger.info(`Enhanced search - JQL: ${jqlQuery}`);
  if (detectedType) {
    logger.info(`Auto-detected issue type: ${detectedType}`);
  }

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Enhanced field selection
    const defaultFields = 'key,summary,status,assignee,priority,created,updated,issuetype,project,description,labels,components';
    const hierarchyFields = 'parent,subtasks,customfield_10011,customfield_10014'; // Epic Link, Epic Name
    const progressFields = 'customfield_10016,customfield_10020,timetracking'; // Story Points, Sprint, Time Tracking
    
    let fields = params.fields || defaultFields;
    
    if (params.includeHierarchy) {
      fields += ',' + hierarchyFields;
    }
    
    if (params.includeProgress) {
      fields += ',' + progressFields;
    }
    
    // Build search URL
    const searchParams = new URLSearchParams({
      jql: jqlQuery,
      maxResults: params.maxResults.toString(),
      startAt: params.startAt.toString(),
      fields: fields,
      expand: 'names'
    });

    const url = `${baseUrl}/rest/api/3/search?${searchParams}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (enhanced search, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Enhanced issue formatting
    const formattedIssues = result.issues.map((issue: any) => 
      formatEnhancedIssue(issue, params.includeHierarchy, params.includeProgress)
    );

    return {
      issues: formattedIssues,
      total: result.total,
      maxResults: result.maxResults,
      startAt: result.startAt,
      jql: jqlQuery,
      detectedIssueType: detectedType,
      searchCriteria: {
        smartFilters: params,
        generatedJQL: jqlQuery
      },
      pagination: {
        hasNext: (result.startAt + result.maxResults) < result.total,
        hasPrevious: result.startAt > 0,
        totalPages: Math.ceil(result.total / result.maxResults),
        currentPage: Math.floor(result.startAt / result.maxResults) + 1
      },
      success: true
    };

  } catch (error) {
    logger.error('Error in enhanced search:', error);
    throw error;
  }
}

export const registerEnhancedSearchIssuesTool = (server: McpServer) => {
  server.tool(
    'searchIssues',
    'Enhanced search for Jira issues with smart filtering, auto-detection, and hierarchy support. Replaces searchEpics and searchStories tools.',
    enhancedSearchIssuesSchema.shape,
    async (params: EnhancedSearchIssuesParams, context: Record<string, any>) => {
      try {
        const result = await enhancedSearchIssuesImpl(params, context);
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
                searchCriteria: params
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
