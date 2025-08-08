import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getProject');

// Input parameter schema
export const getProjectSchema = z.object({
  projectKey: z.string().describe('Project key or ID (e.g., PROJ or 10000)'),
  expand: z.string().optional().describe('Expand additional information (e.g., "description,lead,issueTypes,url,projectKeys")')
});

type GetProjectParams = z.infer<typeof getProjectSchema>;

async function getProjectImpl(params: GetProjectParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting project details for: ${params.projectKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL with optional expand parameter
    let url = `${baseUrl}/rest/api/3/project/${encodeURIComponent(params.projectKey)}`;
    
    if (params.expand) {
      url += `?expand=${encodeURIComponent(params.expand)}`;
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get project, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const project = await response.json();
    
    // Format comprehensive project information
    const formattedProject = {
      id: project.id,
      key: project.key,
      name: project.name,
      description: project.description,
      lead: project.lead ? {
        accountId: project.lead.accountId,
        displayName: project.lead.displayName,
        emailAddress: project.lead.emailAddress,
        avatarUrls: project.lead.avatarUrls
      } : null,
      components: project.components?.map((comp: any) => ({
        id: comp.id,
        name: comp.name,
        description: comp.description,
        lead: comp.lead ? {
          accountId: comp.lead.accountId,
          displayName: comp.lead.displayName
        } : null,
        assigneeType: comp.assigneeType,
        realAssigneeType: comp.realAssigneeType,
        isAssigneeTypeValid: comp.isAssigneeTypeValid
      })) || [],
      issueTypes: project.issueTypes?.map((issueType: any) => ({
        id: issueType.id,
        name: issueType.name,
        description: issueType.description,
        iconUrl: issueType.iconUrl,
        subtask: issueType.subtask,
        statuses: issueType.statuses?.map((status: any) => ({
          id: status.id,
          name: status.name,
          description: status.description,
          iconUrl: status.iconUrl,
          statusCategory: {
            id: status.statusCategory?.id,
            name: status.statusCategory?.name,
            colorName: status.statusCategory?.colorName
          }
        })) || []
      })) || [],
      url: project.url,
      email: project.email,
      assigneeType: project.assigneeType,
      versions: project.versions?.map((version: any) => ({
        id: version.id,
        name: version.name,
        description: version.description,
        archived: version.archived,
        released: version.released,
        startDate: version.startDate,
        releaseDate: version.releaseDate,
        overdue: version.overdue,
        userStartDate: version.userStartDate,
        userReleaseDate: version.userReleaseDate
      })) || [],
      roles: project.roles ? Object.entries(project.roles).reduce((acc, [role, url]) => {
        acc[role] = url as string;
        return acc;
      }, {} as Record<string, string>) : {},
      avatarUrls: project.avatarUrls,
      projectCategory: project.projectCategory ? {
        id: project.projectCategory.id,
        name: project.projectCategory.name,
        description: project.projectCategory.description
      } : null,
      projectTypeKey: project.projectTypeKey,
      simplified: project.simplified,
      style: project.style,
      isPrivate: project.isPrivate,
      properties: project.properties || {},
      uuid: project.uuid,
      insight: project.insight ? {
        totalIssueCount: project.insight.totalIssueCount,
        lastIssueUpdateTime: project.insight.lastIssueUpdateTime
      } : null,
      deleted: project.deleted,
      retentionTillDate: project.retentionTillDate,
      deletedDate: project.deletedDate,
      deletedBy: project.deletedBy ? {
        accountId: project.deletedBy.accountId,
        displayName: project.deletedBy.displayName
      } : null,
      archived: project.archived
    };

    return {
      project: formattedProject,
      success: true
    };

  } catch (error) {
    logger.error('Error getting project:', error);
    throw error;
  }
}

export const registerGetProjectTool = (server: McpServer) => {
  server.tool(
    'getProject',
    'Get detailed information about a specific Jira project',
    getProjectSchema.shape,
    async (params: GetProjectParams, context: Record<string, any>) => {
      try {
        const result = await getProjectImpl(params, context);
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
                projectKey: params.projectKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};