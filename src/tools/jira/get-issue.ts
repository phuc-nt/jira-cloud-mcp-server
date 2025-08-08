import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getIssue');

// Input parameter schema
export const getIssueSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)')
});

type GetIssueParams = z.infer<typeof getIssueSchema>;

async function getIssueImpl(params: GetIssueParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting issue details for: ${params.issueKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Get comprehensive issue details
    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}?expand=names,renderedFields,transitions,changelog`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get issue, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const issue = await response.json();
    
    // Format comprehensive issue information
    const formattedIssue = {
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
        name: issue.fields.issuetype?.name,
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
      },
      subtasks: issue.fields.subtasks?.map((subtask: any) => ({
        key: subtask.key,
        summary: subtask.fields.summary,
        status: subtask.fields.status?.name
      })) || [],
      parent: issue.fields.parent ? {
        key: issue.fields.parent.key,
        summary: issue.fields.parent.fields.summary
      } : null,
      // Available transitions
      transitions: issue.transitions?.map((trans: any) => ({
        id: trans.id,
        name: trans.name,
        to: trans.to.name
      })) || []
    };

    return {
      issue: formattedIssue,
      success: true
    };

  } catch (error) {
    logger.error('Error getting issue:', error);
    throw error;
  }
}

export const registerGetIssueTool = (server: McpServer) => {
  server.tool(
    'getIssue',
    'Get detailed information about a specific Jira issue',
    getIssueSchema.shape,
    async (params: GetIssueParams, context: Record<string, any>) => {
      try {
        const result = await getIssueImpl(params, context);
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