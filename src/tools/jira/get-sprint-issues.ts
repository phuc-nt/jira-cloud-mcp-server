import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getSprintIssues');

// Input parameter schema
export const getSprintIssuesSchema = z.object({
  sprintId: z.union([z.string(), z.number()]).describe('Sprint ID'),
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of issues to return (default: 50, max: 100)'),
  jql: z.string().optional().describe('JQL query to filter issues within the sprint'),
  validateQuery: z.boolean().optional().describe('Validate JQL query (default: true)'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (default: summary,status,assignee,reporter,priority)'),
  expand: z.string().optional().describe('Expand options (e.g., "names,schema,operations")')
});

type GetSprintIssuesParams = z.infer<typeof getSprintIssuesSchema>;

async function getSprintIssuesImpl(params: GetSprintIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting issues for sprint ID: ${params.sprintId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.jql) queryParams.append('jql', params.jql);
    if (params.validateQuery !== undefined) queryParams.append('validateQuery', params.validateQuery.toString());
    if (params.fields) queryParams.append('fields', params.fields);
    if (params.expand) queryParams.append('expand', params.expand);

    // Use Agile API v1.0 for sprint issues
    let url = `${baseUrl}/rest/agile/1.0/sprint/${encodeURIComponent(params.sprintId.toString())}/issue`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get sprint issues, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format issues information
    const issues = data.issues?.map((issue: any) => ({
      id: issue.id,
      key: issue.key,
      self: issue.self,
      summary: issue.fields?.summary,
      description: issue.fields?.description,
      status: {
        id: issue.fields?.status?.id,
        name: issue.fields?.status?.name,
        category: issue.fields?.status?.statusCategory?.name,
        colorName: issue.fields?.status?.statusCategory?.colorName
      },
      issueType: {
        id: issue.fields?.issuetype?.id,
        name: issue.fields?.issuetype?.name,
        iconUrl: issue.fields?.issuetype?.iconUrl,
        subtask: issue.fields?.issuetype?.subtask
      },
      project: {
        id: issue.fields?.project?.id,
        key: issue.fields?.project?.key,
        name: issue.fields?.project?.name
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
        emailAddress: issue.fields.reporter.emailAddress
      } : null,
      priority: {
        id: issue.fields?.priority?.id,
        name: issue.fields?.priority?.name,
        iconUrl: issue.fields?.priority?.iconUrl
      },
      labels: issue.fields?.labels || [],
      components: issue.fields?.components?.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        description: comp.description
      })) || [],
      fixVersions: issue.fields?.fixVersions?.map((version: any) => ({
        id: version.id,
        name: version.name,
        released: version.released,
        releaseDate: version.releaseDate
      })) || [],
      created: issue.fields?.created,
      updated: issue.fields?.updated,
      duedate: issue.fields?.duedate,
      resolution: issue.fields?.resolution ? {
        id: issue.fields.resolution.id,
        name: issue.fields.resolution.name,
        description: issue.fields.resolution.description
      } : null,
      resolutiondate: issue.fields?.resolutiondate,
      // Time tracking information
      timeTracking: {
        originalEstimate: issue.fields?.timeoriginalestimate,
        remainingEstimate: issue.fields?.timeestimate,
        timeSpent: issue.fields?.timespent,
        originalEstimateSeconds: issue.fields?.timeoriginalestimate,
        remainingEstimateSeconds: issue.fields?.timeestimate,
        timeSpentSeconds: issue.fields?.timespent
      },
      // Story points if available
      storyPoints: issue.fields?.customfield_10016 || issue.fields?.storyPoints,
      // Epic information if available
      epic: issue.fields?.epic ? {
        id: issue.fields.epic.id,
        key: issue.fields.epic.key,
        name: issue.fields.epic.name,
        summary: issue.fields.epic.summary,
        done: issue.fields.epic.done
      } : null,
      // Sprint information
      sprint: {
        id: params.sprintId,
        current: true
      },
      // Subtasks information
      subtasks: issue.fields?.subtasks?.map((subtask: any) => ({
        id: subtask.id,
        key: subtask.key,
        summary: subtask.fields?.summary,
        status: subtask.fields?.status?.name,
        assignee: subtask.fields?.assignee?.displayName
      })) || [],
      // Parent issue if this is a subtask
      parent: issue.fields?.parent ? {
        id: issue.fields.parent.id,
        key: issue.fields.parent.key,
        summary: issue.fields.parent.fields?.summary
      } : null
    })) || [];

    // Calculate sprint statistics
    const sprintStats = {
      totalIssues: issues.length,
      statusDistribution: issues.reduce((acc: Record<string, number>, issue: any) => {
        const status = issue.status.name || 'Unknown';
        acc[status] = (acc[status] || 0) + 1;
        return acc;
      }, {}),
      issueTypeDistribution: issues.reduce((acc: Record<string, number>, issue: any) => {
        const type = issue.issueType.name || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      assigneeDistribution: issues.reduce((acc: Record<string, number>, issue: any) => {
        const assignee = issue.assignee?.displayName || 'Unassigned';
        acc[assignee] = (acc[assignee] || 0) + 1;
        return acc;
      }, {}),
      totalStoryPoints: issues.reduce((sum: any, issue: any) => sum + (issue.storyPoints || 0), 0)
    };

    return {
      sprintId: params.sprintId,
      issues,
      sprintStatistics: sprintStats,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50,
        total: data.total || issues.length,
        isLast: data.startAt + data.maxResults >= data.total
      },
      totalIssues: data.total || issues.length,
      filters: params,
      success: true
    };

  } catch (error) {
    logger.error('Error getting sprint issues:', error);
    throw error;
  }
}

export const registerGetSprintIssuesTool = (server: McpServer) => {
  server.tool(
    'getSprintIssues',
    'Get issues from a specific Jira sprint with optional filtering, pagination, and sprint statistics',
    getSprintIssuesSchema.shape,
    async (params: GetSprintIssuesParams, context: Record<string, any>) => {
      try {
        const result = await getSprintIssuesImpl(params, context);
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
                error: error instanceof Error ? error.message : String(error) 
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};