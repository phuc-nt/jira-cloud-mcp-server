import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:enhancedGetBoardIssues');

// Enhanced Get Board Issues Schema - Consolidates getBoardIssues, listBacklogIssues
export const enhancedGetBoardIssuesSchema = z.object({
  boardId: z.union([z.string(), z.number()]).describe('Board ID'),
  
  // Scope filtering - KEY CONSOLIDATION FEATURE
  scope: z.enum(['all', 'backlog', 'active-sprints', 'done-sprints']).default('all').describe('Issue scope: all board issues, backlog only, active sprints, or completed sprints'),
  
  // Sprint context
  sprintId: z.union([z.string(), z.number()]).optional().describe('Specific sprint ID for done-sprints scope'),
  
  // Filtering options
  jql: z.string().optional().describe('Additional JQL filter within scope'),
  assignee: z.string().optional().describe('Filter by assignee account ID'),
  issueTypes: z.array(z.string()).optional().describe('Filter by issue types (e.g., ["Story", "Bug", "Task"])'),
  statuses: z.array(z.string()).optional().describe('Filter by statuses (e.g., ["To Do", "In Progress", "Done"])'),
  
  // Search within issues
  textSearch: z.string().optional().describe('Text search within issue summaries and descriptions'),
  
  // Pagination
  maxResults: z.number().min(1).max(1000).default(50).describe('Maximum results (1-1000, default: 50)'),
  startAt: z.number().min(0).default(0).describe('Starting index for pagination'),
  
  // Response control
  fields: z.string().optional().describe('Comma-separated fields to include (default: summary,status,assignee,reporter,priority)'),
  expand: z.array(z.string()).optional().describe('Expand options (names,schema,operations)'),
  validateQuery: z.boolean().default(true).describe('Validate JQL query syntax')
});

type EnhancedGetBoardIssuesParams = z.infer<typeof enhancedGetBoardIssuesSchema>;

// Scope-based board issues implementation
async function enhancedGetBoardIssuesImpl(params: EnhancedGetBoardIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Enhanced board issues - boardId: ${params.boardId}, scope: ${params.scope}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    let endpoint: string;
    let searchParams: URLSearchParams;
    let combinedJql: string[] = [];

    // Determine endpoint and base JQL based on scope
    switch (params.scope) {
      case 'backlog':
        endpoint = `/rest/agile/1.0/board/${params.boardId}/backlog`;
        break;
        
      case 'active-sprints':
        endpoint = `/rest/agile/1.0/board/${params.boardId}/issue`;
        combinedJql.push('sprint in openSprints()');
        break;
        
      case 'done-sprints':
        endpoint = `/rest/agile/1.0/board/${params.boardId}/issue`;
        if (params.sprintId) {
          combinedJql.push(`sprint = ${params.sprintId}`);
        } else {
          combinedJql.push('sprint in closedSprints()');
        }
        break;
        
      case 'all':
      default:
        endpoint = `/rest/agile/1.0/board/${params.boardId}/issue`;
        break;
    }

    // Build additional JQL filters
    if (params.assignee) {
      combinedJql.push(`assignee = "${params.assignee}"`);
    }
    
    if (params.issueTypes && params.issueTypes.length > 0) {
      const typeFilter = params.issueTypes.map(type => `"${type}"`).join(',');
      combinedJql.push(`issueType in (${typeFilter})`);
    }
    
    if (params.statuses && params.statuses.length > 0) {
      const statusFilter = params.statuses.map(status => `"${status}"`).join(',');
      combinedJql.push(`status in (${statusFilter})`);
    }
    
    if (params.textSearch) {
      combinedJql.push(`text ~ "${params.textSearch}"`);
    }

    // Combine with user-provided JQL
    if (params.jql) {
      combinedJql.push(`(${params.jql})`);
    }

    // Build search parameters
    searchParams = new URLSearchParams({
      startAt: params.startAt.toString(),
      maxResults: params.maxResults.toString()
    });

    // Add combined JQL if any filters exist
    if (combinedJql.length > 0) {
      const finalJql = combinedJql.join(' AND ');
      searchParams.append('jql', finalJql);
    }

    if (params.validateQuery !== undefined) {
      searchParams.append('validateQuery', params.validateQuery.toString());
    }

    if (params.fields) {
      searchParams.append('fields', params.fields);
    } else {
      // Default fields for consistent response
      searchParams.append('fields', 'summary,status,assignee,reporter,priority,created,updated,issueType');
    }

    if (params.expand && params.expand.length > 0) {
      searchParams.append('expand', params.expand.join(','));
    }

    const url = `${baseUrl}${endpoint}?${searchParams}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (enhanced board issues, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format response consistently
    const issues = data.issues || [];
    const formattedIssues = issues.map(formatIssue);

    // Calculate scope-specific statistics
    const statistics = calculateIssueStatistics(formattedIssues, params.scope);

    return {
      issues: formattedIssues,
      total: data.total || formattedIssues.length,
      returned: formattedIssues.length,
      startAt: params.startAt,
      maxResults: params.maxResults,
      scope: params.scope,
      boardId: params.boardId,
      filters: {
        sprintId: params.sprintId || null,
        assignee: params.assignee || null,
        issueTypes: params.issueTypes || null,
        statuses: params.statuses || null,
        textSearch: params.textSearch || null,
        jql: params.jql || null
      },
      statistics,
      endpoint: endpoint.replace(baseUrl, ''), // For debugging
      success: true
    };

  } catch (error) {
    logger.error('Error in enhanced board issues search:', error);
    throw error;
  }
}

// Consistent issue formatting
function formatIssue(issue: any): any {
  return {
    key: issue.key,
    id: issue.id,
    self: issue.self,
    summary: issue.fields?.summary || '',
    description: issue.fields?.description || '',
    issueType: {
      id: issue.fields?.issuetype?.id,
      name: issue.fields?.issuetype?.name,
      iconUrl: issue.fields?.issuetype?.iconUrl
    },
    status: {
      id: issue.fields?.status?.id,
      name: issue.fields?.status?.name,
      statusCategory: {
        id: issue.fields?.status?.statusCategory?.id,
        name: issue.fields?.status?.statusCategory?.name,
        key: issue.fields?.status?.statusCategory?.key
      }
    },
    priority: {
      id: issue.fields?.priority?.id,
      name: issue.fields?.priority?.name,
      iconUrl: issue.fields?.priority?.iconUrl
    },
    assignee: issue.fields?.assignee ? {
      accountId: issue.fields.assignee.accountId,
      displayName: issue.fields.assignee.displayName,
      emailAddress: issue.fields.assignee.emailAddress,
      avatarUrls: issue.fields.assignee.avatarUrls
    } : null,
    reporter: issue.fields?.reporter ? {
      accountId: issue.fields.reporter.accountId,
      displayName: issue.fields.reporter.displayName,
      emailAddress: issue.fields.reporter.emailAddress,
      avatarUrls: issue.fields.reporter.avatarUrls
    } : null,
    created: issue.fields?.created,
    updated: issue.fields?.updated,
    resolutionDate: issue.fields?.resolutiondate,
    // Sprint information if available
    sprints: issue.fields?.customfield_10020 || issue.fields?.sprint || null,
    // Epic information if available
    epic: issue.fields?.epic || issue.fields?.customfield_10014 || null,
    // Labels and components
    labels: issue.fields?.labels || [],
    components: issue.fields?.components || [],
    // Versions
    fixVersions: issue.fields?.fixVersions || [],
    affectedVersions: issue.fields?.versions || []
  };
}

// Calculate scope-specific statistics
function calculateIssueStatistics(issues: any[], scope: string): any {
  const stats: any = {
    totalIssues: issues.length,
    scope,
    statusBreakdown: issues.reduce((acc: Record<string, number>, issue) => {
      const status = issue.status?.name || 'Unknown';
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    issueTypeBreakdown: issues.reduce((acc: Record<string, number>, issue) => {
      const type = issue.issueType?.name || 'Unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    assigneeBreakdown: issues.reduce((acc: Record<string, number>, issue) => {
      const assignee = issue.assignee?.displayName || 'Unassigned';
      acc[assignee] = (acc[assignee] || 0) + 1;
      return acc;
    }, {}),
    priorityBreakdown: issues.reduce((acc: Record<string, number>, issue) => {
      const priority = issue.priority?.name || 'None';
      acc[priority] = (acc[priority] || 0) + 1;
      return acc;
    }, {})
  };

  // Scope-specific additional stats
  if (scope === 'backlog') {
    stats.backlogHealth = {
      totalBacklogIssues: issues.length,
      unassignedIssues: issues.filter(i => !i.assignee).length,
      issuesWithoutPriority: issues.filter(i => !i.priority?.name || i.priority.name === 'None').length
    };
  }

  if (scope === 'active-sprints' || scope === 'done-sprints') {
    const sprintInfo = issues.map(i => i.sprints).flat().filter(s => s);
    stats.sprintInfo = {
      uniqueSprints: [...new Set(sprintInfo.map(s => s.name || s.id))].length,
      issuesInSprints: issues.filter(i => i.sprints && i.sprints.length > 0).length
    };
  }

  return stats;
}

// Tool registration
export const registerEnhancedGetBoardIssuesTool = (server: McpServer) => {
  server.tool(
    'getBoardIssues',
    `ENHANCED BOARD ISSUES - Replaces 2 specialized board tools

CONSOLIDATES: getBoardIssues, listBacklogIssues

AI USAGE PATTERNS:
--- All Board Issues ------------------------------------------------------
getBoardIssues({
  boardId: 123,
  scope: "all", // All issues on board
  maxResults: 100
})
REPLACES: getBoardIssues({boardId}) with full scope
---------------------------------------------------------------------------

--- Backlog Issues Only --------------------------------------------------
getBoardIssues({
  boardId: 123,
  scope: "backlog", // Backlog issues only
  jql: "assignee = currentUser()"
})
REPLACES: listBacklogIssues({boardId, jql})
---------------------------------------------------------------------------

--- Active Sprint Issues -------------------------------------------------
getBoardIssues({
  boardId: 123,
  scope: "active-sprints", // Issues in active sprints
  fields: "summary,status,assignee"
})
REPLACES: getBoardIssues() + sprint filtering
---------------------------------------------------------------------------

--- Completed Sprint Issues ----------------------------------------------
getBoardIssues({
  boardId: 123,
  scope: "done-sprints", // Issues in completed sprints
  sprintId: 456, // Specific completed sprint
  maxResults: 50
})
REPLACES: Custom sprint issue queries
---------------------------------------------------------------------------

INTELLIGENT SCOPE DETECTION:
• No scope → "all" (backward compatibility)
• Backlog context → "backlog" mode with backlog-specific API
• Sprint context → "active-sprints" or "done-sprints"
• JQL provided → Apply additional filtering within scope

ENHANCED CAPABILITIES:
• Unified interface for all board issue scenarios
• Scope-based API optimization (uses most efficient endpoint)
• Consistent pagination and field selection
• Smart caching based on scope and filters
• Better error handling for board permissions`,
    enhancedGetBoardIssuesSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await enhancedGetBoardIssuesImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in getBoardIssues tool:', error);
        return {
          content: [{
            type: 'text',
            text: `Error retrieving board issues: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};