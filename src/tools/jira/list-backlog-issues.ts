import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listBacklogIssues');

// Input parameter schema
export const listBacklogIssuesSchema = z.object({
  boardId: z.union([z.string(), z.number()]).describe('Board ID'),
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of issues to return (default: 50, max: 100)'),
  jql: z.string().optional().describe('JQL query to filter backlog issues'),
  validateQuery: z.boolean().optional().describe('Validate JQL query (default: true)'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (default: summary,status,assignee,reporter,priority)'),
  expand: z.string().optional().describe('Expand options (e.g., "names,schema,operations")')
});

type ListBacklogIssuesParams = z.infer<typeof listBacklogIssuesSchema>;

async function listBacklogIssuesImpl(params: ListBacklogIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting backlog issues for board ID: ${params.boardId}`);

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

    // Use Agile API v1.0 for backlog issues
    let url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}/backlog`;
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
      logger.error(`Jira Agile API error (get backlog issues, ${response.status}):`, responseText);
      
      const statusCode = response.status;
      if (statusCode === 400) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          "Bad request. Check board ID and query parameters.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          "Forbidden. You don't have permission to view this board.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Board ${params.boardId} not found`,
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira Agile API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
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
      priority: {
        id: issue.fields?.priority?.id,
        name: issue.fields?.priority?.name,
        iconUrl: issue.fields?.priority?.iconUrl
      },
      assignee: issue.fields?.assignee ? {
        accountId: issue.fields.assignee.accountId,
        displayName: issue.fields.assignee.displayName,
        emailAddress: issue.fields.assignee.emailAddress
      } : null,
      reporter: issue.fields?.reporter ? {
        accountId: issue.fields.reporter.accountId,
        displayName: issue.fields.reporter.displayName,
        emailAddress: issue.fields.reporter.emailAddress
      } : null,
      created: issue.fields?.created,
      updated: issue.fields?.updated,
      resolutionDate: issue.fields?.resolutiondate,
      dueDate: issue.fields?.duedate,
      estimatedTimeSeconds: issue.fields?.timeoriginalestimate,
      timeSpentSeconds: issue.fields?.timespent,
      remainingTimeSeconds: issue.fields?.timeestimate,
      labels: issue.fields?.labels || [],
      components: issue.fields?.components?.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        description: comp.description
      })) || [],
      fixVersions: issue.fields?.fixVersions?.map((version: any) => ({
        id: version.id,
        name: version.name,
        description: version.description,
        released: version.released,
        releaseDate: version.releaseDate
      })) || [],
      project: {
        id: issue.fields?.project?.id,
        key: issue.fields?.project?.key,
        name: issue.fields?.project?.name
      }
    })) || [];

    return {
      boardId: params.boardId,
      backlogIssues: issues,
      total: data.total || 0,
      maxResults: data.maxResults || 50,
      startAt: data.startAt || 0,
      isLast: data.isLast || false,
      success: true
    };

  } catch (error) {
    logger.error('Error getting backlog issues:', error);
    if (error instanceof ApiError) {
      throw error;
    }
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Error getting backlog issues: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

export const registerListBacklogIssuesTool = (server: McpServer) => {
  server.tool(
    'listBacklogIssues',
    'List issues in a board\'s backlog (GET /rest/agile/1.0/board/{boardId}/backlog)',
    listBacklogIssuesSchema.shape,
    async (params: ListBacklogIssuesParams, context: Record<string, any>) => {
      try {
        const result = await listBacklogIssuesImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in listBacklogIssues:', error);
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
