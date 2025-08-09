import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:searchEpics');

// Input schema for searchEpics tool
const SearchEpicsInputSchema = z.object({
  projectKey: z.string().optional().describe('Project key to search within (e.g., PROJ)'),
  status: z.string().optional().describe('Epic status to filter by'),
  summary: z.string().optional().describe('Text to search in Epic summary'),
  jql: z.string().optional().describe('Custom JQL query for advanced filtering'),
  startAt: z.number().default(0).describe('Start index for pagination'),
  maxResults: z.number().default(50).describe('Maximum number of epics to return'),
  fields: z.array(z.string()).default([]).describe('List of fields to include in response'),
  expand: z.array(z.string()).default([]).describe('List of parameters to expand')
});

type SearchEpicsParams = z.infer<typeof SearchEpicsInputSchema>;

async function searchEpicsImpl(params: SearchEpicsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Searching Epics with criteria: ${JSON.stringify(params)}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Build JQL query
    let jqlParts = ['issuetype = "Epic"'];
    
    if (params.projectKey) {
      jqlParts.push(`project = "${params.projectKey}"`);
    }
    
    if (params.status) {
      jqlParts.push(`status = "${params.status}"`);
    }
    
    if (params.summary) {
      jqlParts.push(`summary ~ "${params.summary}"`);
    }
    
    // Use custom JQL if provided, otherwise use built query
    const jqlQuery = params.jql || jqlParts.join(' AND ') + ' ORDER BY created DESC';
    
    // Build query parameters
    const queryParams = new URLSearchParams({
      jql: jqlQuery,
      startAt: params.startAt.toString(),
      maxResults: params.maxResults.toString(),
      validateQuery: 'true'
    });

    if (params.fields.length > 0) {
      queryParams.append('fields', params.fields.join(','));
    } else {
      // Default fields for Epic search
      queryParams.append('fields', 'summary,status,priority,assignee,reporter,created,updated,issuetype,project');
    }

    if (params.expand.length > 0) {
      queryParams.append('expand', params.expand.join(','));
    }
    
    // Call Jira API to search Epics
    const url = `${baseUrl}/rest/api/3/search?${queryParams}`;
    
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (search epics, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format the epics data with Epic-specific information
    const formattedEpics = result.issues?.map((epic: any) => ({
      key: epic.key,
      id: epic.id,
      self: epic.self,
      summary: epic.fields?.summary,
      description: epic.fields?.description,
      status: {
        name: epic.fields?.status?.name,
        id: epic.fields?.status?.id,
        category: epic.fields?.status?.statusCategory?.name
      },
      priority: {
        name: epic.fields?.priority?.name,
        id: epic.fields?.priority?.id
      },
      assignee: epic.fields?.assignee ? {
        accountId: epic.fields.assignee.accountId,
        displayName: epic.fields.assignee.displayName,
        emailAddress: epic.fields.assignee.emailAddress
      } : null,
      reporter: epic.fields?.reporter ? {
        accountId: epic.fields.reporter.accountId,
        displayName: epic.fields.reporter.displayName,
        emailAddress: epic.fields.reporter.emailAddress
      } : null,
      project: {
        key: epic.fields?.project?.key,
        name: epic.fields?.project?.name,
        id: epic.fields?.project?.id
      },
      created: epic.fields?.created,
      updated: epic.fields?.updated,
      // Epic-specific fields (if available from custom fields)
      epicName: epic.fields?.customfield_10011 || epic.fields?.epicName,
      epicColor: epic.fields?.customfield_10012 || epic.fields?.epicColor,
      epicStatus: epic.fields?.customfield_10013 || epic.fields?.epicStatus
    })) || [];
    
    logger.info(`Successfully found ${formattedEpics.length} Epics`);
    
    return {
      success: true,
      query: jqlQuery,
      total: result.total || 0,
      startAt: result.startAt || 0,
      maxResults: result.maxResults || params.maxResults,
      epicCount: formattedEpics.length,
      epics: formattedEpics,
      message: `Found ${formattedEpics.length} Epics matching criteria`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error searching Epics:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to search Epics: ${error.message}`, 500);
  }
}

/**
 * Search and filter Epics using JQL with Epic-specific criteria
 */
export const registerSearchEpicsTool = (server: any) => {
  server.tool(
    'searchEpics',
    'Search and filter Epics using JQL with Epic-specific criteria and status filtering',
    SearchEpicsInputSchema.shape,
    async (params: SearchEpicsParams, context: Record<string, any>) => {
      try {
        const result = await searchEpicsImpl(params, context);
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
                query: params.jql || 'Generated query'
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
