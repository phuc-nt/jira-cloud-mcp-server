import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:searchStories');

// Input schema for searchStories tool
const SearchStoriesInputSchema = z.object({
  projectKey: z.string().optional().describe('Project key to search within (e.g., PROJ)'),
  epicKey: z.string().optional().describe('Epic key to filter Stories by'),
  status: z.string().optional().describe('Story status to filter by'),
  assignee: z.string().optional().describe('Assignee account ID to filter by'),
  sprintId: z.string().optional().describe('Sprint ID to filter by'),
  storyPoints: z.number().optional().describe('Story points to filter by'),
  summary: z.string().optional().describe('Text to search in Story summary'),
  jql: z.string().optional().describe('Custom JQL query for advanced filtering'),
  startAt: z.number().default(0).describe('Start index for pagination'),
  maxResults: z.number().default(50).describe('Maximum number of stories to return'),
  fields: z.array(z.string()).default([]).describe('List of fields to include in response'),
  expand: z.array(z.string()).default([]).describe('List of parameters to expand')
});

type SearchStoriesParams = z.infer<typeof SearchStoriesInputSchema>;

async function searchStoriesImpl(params: SearchStoriesParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Searching Stories with criteria: ${JSON.stringify(params)}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Build JQL query
    let jqlParts = ['issuetype = "Story"'];
    
    if (params.projectKey) {
      jqlParts.push(`project = "${params.projectKey}"`);
    }
    
    if (params.status) {
      jqlParts.push(`status = "${params.status}"`);
    }
    
    if (params.assignee) {
      jqlParts.push(`assignee = "${params.assignee}"`);
    }
    
    if (params.epicKey) {
      // Try multiple Epic Link field patterns
      jqlParts.push(`("Epic Link" = "${params.epicKey}" OR cf[10014] = "${params.epicKey}" OR cf[10008] = "${params.epicKey}")`);
    }
    
    if (params.sprintId) {
      jqlParts.push(`Sprint = ${params.sprintId}`);
    }
    
    if (params.storyPoints !== undefined) {
      // Try multiple Story Points field patterns
      jqlParts.push(`("Story Points" = ${params.storyPoints} OR cf[10016] = ${params.storyPoints} OR cf[10004] = ${params.storyPoints})`);
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
      // Default fields for Story search including custom fields
      queryParams.append('fields', 'summary,status,priority,assignee,reporter,created,updated,issuetype,project,customfield_10016,customfield_10014,customfield_10004,customfield_10008,sprint');
    }

    if (params.expand.length > 0) {
      queryParams.append('expand', params.expand.join(','));
    }
    
    // Call Jira API to search Stories
    const url = `${baseUrl}/rest/api/3/search?${queryParams}`;
    
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (search stories, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format the stories data with Story-specific information
    const formattedStories = result.issues?.map((story: any) => ({
      key: story.key,
      id: story.id,
      self: story.self,
      summary: story.fields?.summary,
      description: story.fields?.description,
      status: {
        name: story.fields?.status?.name,
        id: story.fields?.status?.id,
        category: story.fields?.status?.statusCategory?.name
      },
      priority: {
        name: story.fields?.priority?.name,
        id: story.fields?.priority?.id
      },
      assignee: story.fields?.assignee ? {
        accountId: story.fields.assignee.accountId,
        displayName: story.fields.assignee.displayName,
        emailAddress: story.fields.assignee.emailAddress
      } : null,
      reporter: story.fields?.reporter ? {
        accountId: story.fields.reporter.accountId,
        displayName: story.fields.reporter.displayName,
        emailAddress: story.fields.reporter.emailAddress
      } : null,
      project: {
        key: story.fields?.project?.key,
        name: story.fields?.project?.name,
        id: story.fields?.project?.id
      },
      created: story.fields?.created,
      updated: story.fields?.updated,
      // Story-specific fields
      storyPoints: story.fields?.customfield_10016 || story.fields?.customfield_10004 || story.fields?.storyPoints,
      epicLink: story.fields?.customfield_10014 || story.fields?.customfield_10008 || story.fields?.epicLink,
      // Sprint information if available
      sprint: story.fields?.sprint ? (Array.isArray(story.fields.sprint) ? story.fields.sprint.map((s: any) => ({
        id: s.id,
        name: s.name,
        state: s.state,
        startDate: s.startDate,
        endDate: s.endDate
      })) : [{
        id: story.fields.sprint.id,
        name: story.fields.sprint.name,
        state: story.fields.sprint.state,
        startDate: story.fields.sprint.startDate,
        endDate: story.fields.sprint.endDate
      }]) : []
    })) || [];
    
    logger.info(`Successfully found ${formattedStories.length} Stories`);
    
    return {
      success: true,
      query: jqlQuery,
      total: result.total || 0,
      startAt: result.startAt || 0,
      maxResults: result.maxResults || params.maxResults,
      storyCount: formattedStories.length,
      stories: formattedStories,
      message: `Found ${formattedStories.length} Stories matching criteria`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error searching Stories:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to search Stories: ${error.message}`, 500);
  }
}

/**
 * Search Stories with Story-specific filters like Epic link and Story points
 */
export const registerSearchStoriesTool = (server: any) => {
  server.tool(
    'searchStories',
    'Search Stories with Story-specific filters like Epic link, Story points, and Sprint assignment',
    SearchStoriesInputSchema.shape,
    async (params: SearchStoriesParams, context: Record<string, any>) => {
      try {
        const result = await searchStoriesImpl(params, context);
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
