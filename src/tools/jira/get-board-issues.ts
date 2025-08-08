import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getBoardIssues');

// Input parameter schema
export const getBoardIssuesSchema = z.object({
  boardId: z.union([z.string(), z.number()]).describe('Board ID'),
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of issues to return (default: 50, max: 100)'),
  jql: z.string().optional().describe('JQL query to filter issues'),
  validateQuery: z.boolean().optional().describe('Validate JQL query (default: true)'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (default: summary,status,assignee,reporter,priority)'),
  expand: z.string().optional().describe('Expand options (e.g., "names,schema,operations")'),
  filterBy: z.object({
    assignee: z.string().optional().describe('Filter by assignee account ID'),
    epic: z.union([z.string(), z.number()]).optional().describe('Filter by epic ID'),
    sprint: z.union([z.string(), z.number()]).optional().describe('Filter by sprint ID'),
    version: z.union([z.string(), z.number()]).optional().describe('Filter by version ID')
  }).optional().describe('Additional filtering options')
});

type GetBoardIssuesParams = z.infer<typeof getBoardIssuesSchema>;

async function getBoardIssuesImpl(params: GetBoardIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting issues for board ID: ${params.boardId}`);

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
    
    // Add filter parameters
    if (params.filterBy?.assignee) queryParams.append('assignee', params.filterBy.assignee);
    if (params.filterBy?.epic) queryParams.append('epic', params.filterBy.epic.toString());
    if (params.filterBy?.sprint) queryParams.append('sprint', params.filterBy.sprint.toString());
    if (params.filterBy?.version) queryParams.append('version', params.filterBy.version.toString());

    // Use Agile API v1.0 for board issues
    let url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}/issue`;
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
      logger.error(`Jira Agile API error (get board issues, ${response.status}):`, responseText);
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
      // Epic information if available
      epic: issue.fields?.epic ? {
        id: issue.fields.epic.id,
        key: issue.fields.epic.key,
        name: issue.fields.epic.name,
        summary: issue.fields.epic.summary,
        done: issue.fields.epic.done
      } : null,
      // Sprint information if available
      sprint: issue.fields?.sprint ? {
        id: issue.fields.sprint.id,
        name: issue.fields.sprint.name,
        state: issue.fields.sprint.state,
        boardId: issue.fields.sprint.originBoardId
      } : null
    })) || [];

    return {
      boardId: params.boardId,
      issues,
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
    logger.error('Error getting board issues:', error);
    throw error;
  }
}

export const registerGetBoardIssuesTool = (server: McpServer) => {
  server.tool(
    'getBoardIssues',
    'Get issues from a specific Jira board with optional filtering and pagination',
    getBoardIssuesSchema.shape,
    async (params: GetBoardIssuesParams, context: Record<string, any>) => {
      try {
        const result = await getBoardIssuesImpl(params, context);
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