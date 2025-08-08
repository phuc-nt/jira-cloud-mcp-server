import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listProjects');

// Input parameter schema
export const listProjectsSchema = z.object({
  expand: z.string().optional().describe('Expand additional project information (e.g., "description,lead,url")'),
  recent: z.boolean().default(false).describe('Only return recently viewed projects'),
  includeArchived: z.boolean().default(false).describe('Include archived projects in results')
});

type ListProjectsParams = z.infer<typeof listProjectsSchema>;

async function listProjectsImpl(params: ListProjectsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Listing projects with options:`, params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL parameters
    const urlParams = new URLSearchParams();
    
    if (params.expand) {
      urlParams.append('expand', params.expand);
    }
    
    if (params.recent) {
      urlParams.append('recent', '20'); // Get last 20 recent projects
    }

    // Note: includeArchived is handled differently in Jira API
    // We'll filter out archived projects by default unless explicitly requested
    if (!params.includeArchived) {
      // This will be handled in the response filtering
    }

    const url = `${baseUrl}/rest/api/3/project?${urlParams}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (list projects, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const projects = await response.json();
    
    // Filter out archived projects if not requested
    const filteredProjects = params.includeArchived ? 
      projects : 
      projects.filter((project: any) => !project.archived);
    
    // Format response with essential project information
    const formattedProjects = filteredProjects.map((project: any) => ({
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      projectTypeKey: project.projectTypeKey,
      simplified: project.simplified,
      style: project.style,
      isPrivate: project.isPrivate,
      lead: project.lead ? {
        accountId: project.lead.accountId,
        displayName: project.lead.displayName,
        emailAddress: project.lead.emailAddress
      } : null,
      components: project.components?.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        description: comp.description
      })) || [],
      versions: project.versions?.map((version: any) => ({
        id: version.id,
        name: version.name,
        description: version.description,
        archived: version.archived,
        released: version.released
      })) || [],
      roles: project.roles ? Object.keys(project.roles).reduce((acc, role) => {
        acc[role] = project.roles[role];
        return acc;
      }, {} as Record<string, string>) : {},
      url: project.url,
      email: project.email,
      archived: project.archived,
      deleted: project.deleted,
      retentionTillDate: project.retentionTillDate,
      deletedDate: project.deletedDate,
      deletedBy: project.deletedBy
    }));

    return {
      projects: formattedProjects,
      total: formattedProjects.length,
      filtered: {
        includeArchived: params.includeArchived,
        recent: params.recent,
        originalTotal: projects.length
      },
      success: true
    };

  } catch (error) {
    logger.error('Error listing projects:', error);
    throw error;
  }
}

export const registerListProjectsTool = (server: McpServer) => {
  server.tool(
    'listProjects',
    'List all accessible Jira projects with optional filtering and expansion',
    listProjectsSchema.shape,
    async (params: ListProjectsParams, context: Record<string, any>) => {
      try {
        const result = await listProjectsImpl(params, context);
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