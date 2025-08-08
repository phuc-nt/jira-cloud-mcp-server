import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listIssues');

// Input parameter schema
export const listIssuesSchema = z.object({
  projectKey: z.string().optional().describe('Filter by project key (e.g., PROJ)'),
  assigneeId: z.string().optional().describe('Filter by assignee account ID'),
  status: z.string().optional().describe('Filter by issue status (e.g., Open, In Progress, Done)'),
  limit: z.number().default(50).describe('Maximum number of issues to return (default: 50)')
});

type ListIssuesParams = z.infer<typeof listIssuesSchema>;

async function listIssuesImpl(params: ListIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Listing issues with filters:`, params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build JQL query based on parameters
    const jqlParts: string[] = [];
    
    if (params.projectKey) {
      jqlParts.push(`project = "${params.projectKey}"`);
    }
    
    if (params.assigneeId) {
      jqlParts.push(`assignee = "${params.assigneeId}"`);
    }
    
    if (params.status) {
      jqlParts.push(`status = "${params.status}"`);
    }

    const jql = jqlParts.length > 0 ? jqlParts.join(' AND ') : '';
    
    // Build search URL
    const searchParams = new URLSearchParams({
      jql: jql,
      maxResults: params.limit.toString(),
      fields: 'key,summary,status,assignee,priority,created,updated,issuetype,project'
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
    
    // Format response for better readability
    const formattedIssues = result.issues.map((issue: any) => ({
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name,
      assignee: issue.fields.assignee?.displayName || 'Unassigned',
      priority: issue.fields.priority?.name,
      issueType: issue.fields.issuetype?.name,
      project: issue.fields.project?.key,
      created: issue.fields.created,
      updated: issue.fields.updated
    }));

    return {
      issues: formattedIssues,
      total: result.total,
      maxResults: result.maxResults,
      startAt: result.startAt,
      jql: jql || 'all issues',
      success: true
    };

  } catch (error) {
    logger.error('Error listing issues:', error);
    throw error;
  }
}

export const registerListIssuesTool = (server: McpServer) => {
  server.tool(
    'listIssues',
    'List Jira issues with optional filtering by project, assignee, and status',
    listIssuesSchema.shape,
    async (params: ListIssuesParams, context: Record<string, any>) => {
      try {
        const result = await listIssuesImpl(params, context);
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