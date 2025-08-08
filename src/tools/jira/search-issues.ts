import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:searchIssues');

// Input parameter schema
export const searchIssuesSchema = z.object({
  jql: z.string().describe('JQL (Jira Query Language) search query'),
  maxResults: z.number().default(50).describe('Maximum number of results to return (default: 50)'),
  startAt: z.number().default(0).describe('Starting index for pagination (default: 0)'),
  fields: z.string().optional().describe('Comma-separated list of fields to include (optional)')
});

type SearchIssuesParams = z.infer<typeof searchIssuesSchema>;

async function searchIssuesImpl(params: SearchIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Searching issues with JQL: ${params.jql}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Default fields if not specified
    const fields = params.fields || 'key,summary,status,assignee,priority,created,updated,issuetype,project,description';
    
    // Build search URL
    const searchParams = new URLSearchParams({
      jql: params.jql,
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
      logger.error(`Jira API error (search, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format response with comprehensive issue information
    const formattedIssues = result.issues.map((issue: any) => ({
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
    }));

    return {
      issues: formattedIssues,
      total: result.total,
      maxResults: result.maxResults,
      startAt: result.startAt,
      jql: params.jql,
      pagination: {
        hasNext: (result.startAt + result.maxResults) < result.total,
        hasPrevious: result.startAt > 0,
        totalPages: Math.ceil(result.total / result.maxResults),
        currentPage: Math.floor(result.startAt / result.maxResults) + 1
      },
      success: true
    };

  } catch (error) {
    logger.error('Error searching issues:', error);
    throw error;
  }
}

export const registerSearchIssuesTool = (server: McpServer) => {
  server.tool(
    'searchIssues',
    'Search Jira issues using JQL (Jira Query Language) with pagination support',
    searchIssuesSchema.shape,
    async (params: SearchIssuesParams, context: Record<string, any>) => {
      try {
        const result = await searchIssuesImpl(params, context);
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
                jql: params.jql
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};