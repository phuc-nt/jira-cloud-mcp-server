import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getEpicIssues');

// Input schema for getEpicIssues tool
const GetEpicIssuesInputSchema = z.object({
  epicKey: z.string().describe('Epic key or ID (e.g., PROJ-123)'),
  startAt: z.number().default(0).describe('Start index for pagination'),
  maxResults: z.number().default(50).describe('Maximum number of issues to return'),
  validateQuery: z.boolean().default(true).describe('Whether to validate the JQL query'),
  fields: z.array(z.string()).default([]).describe('List of fields to include in response'),
  expand: z.array(z.string()).default([]).describe('List of parameters to expand')
});

type GetEpicIssuesParams = z.infer<typeof GetEpicIssuesInputSchema>;

async function getEpicIssuesImpl(params: GetEpicIssuesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting issues for Epic: ${params.epicKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      startAt: params.startAt.toString(),
      maxResults: params.maxResults.toString(),
      validateQuery: params.validateQuery.toString()
    });

    if (params.fields.length > 0) {
      queryParams.append('fields', params.fields.join(','));
    }

    if (params.expand.length > 0) {
      queryParams.append('expand', params.expand.join(','));
    }
    
    // Call Jira Agile API to get Epic issues
    const url = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(params.epicKey)}/issue?${queryParams}`;
    
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get epic issues, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format the issues data
    const formattedIssues = result.issues?.map((issue: any) => ({
      key: issue.key,
      id: issue.id,
      self: issue.self,
      summary: issue.fields?.summary,
      status: {
        name: issue.fields?.status?.name,
        id: issue.fields?.status?.id,
        category: issue.fields?.status?.statusCategory?.name
      },
      issueType: {
        name: issue.fields?.issuetype?.name,
        id: issue.fields?.issuetype?.id,
        subtask: issue.fields?.issuetype?.subtask
      },
      priority: {
        name: issue.fields?.priority?.name,
        id: issue.fields?.priority?.id
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
      // Story points if available
      storyPoints: issue.fields?.customfield_10016 || issue.fields?.storyPoints,
      // Sprint information if available
      sprint: issue.fields?.sprint ? {
        id: issue.fields.sprint.id,
        name: issue.fields.sprint.name,
        state: issue.fields.sprint.state
      } : null
    })) || [];
    
    logger.info(`Successfully retrieved ${formattedIssues.length} issues for Epic: ${params.epicKey}`);
    
    return {
      success: true,
      epicKey: params.epicKey,
      total: result.total || 0,
      startAt: result.startAt || 0,
      maxResults: result.maxResults || params.maxResults,
      issueCount: formattedIssues.length,
      issues: formattedIssues,
      message: `Found ${formattedIssues.length} issues for Epic ${params.epicKey}`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error getting issues for Epic ${params.epicKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to get Epic issues: ${error.message}`, 500);
  }
}

/**
 * Get all issues belonging to an Epic using Jira Agile API
 */
export const registerGetEpicIssuesTool = (server: any) => {
  server.tool(
    'getEpicIssues',
    'Get all issues belonging to an Epic using Jira Agile API with hierarchy and progress information',
    GetEpicIssuesInputSchema.shape,
    async (params: GetEpicIssuesParams, context: Record<string, any>) => {
      try {
        const result = await getEpicIssuesImpl(params, context);
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
                epicKey: params.epicKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
