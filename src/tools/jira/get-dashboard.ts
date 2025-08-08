import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getDashboard');

// Input parameter schema
export const getDashboardSchema = z.object({
  dashboardId: z.union([z.string(), z.number()]).describe('Dashboard ID'),
  expand: z.string().optional().describe('Expand options (e.g., "description,owner,viewUrl,favourite,favouritedCount,sharePermissions,editPermissions")')
});

type GetDashboardParams = z.infer<typeof getDashboardSchema>;

async function getDashboardImpl(params: GetDashboardParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting dashboard details for ID: ${params.dashboardId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL with optional expand parameter
    let url = `${baseUrl}/rest/api/3/dashboard/${encodeURIComponent(params.dashboardId.toString())}`;
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
      logger.error(`Jira API error (get dashboard, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const dashboard = await response.json();
    
    // Format dashboard information
    const formattedDashboard = {
      id: dashboard.id,
      self: dashboard.self,
      name: dashboard.name,
      description: dashboard.description,
      owner: dashboard.owner ? {
        accountId: dashboard.owner.accountId,
        displayName: dashboard.owner.displayName,
        emailAddress: dashboard.owner.emailAddress,
        avatarUrls: dashboard.owner.avatarUrls,
        active: dashboard.owner.active,
        timeZone: dashboard.owner.timeZone,
        locale: dashboard.owner.locale
      } : null,
      view: dashboard.view,
      viewUrl: dashboard.viewUrl,
      popularity: dashboard.popularity,
      favourite: dashboard.favourite,
      favouritedCount: dashboard.favouritedCount,
      // Dashboard configuration
      automaticRefreshMs: dashboard.automaticRefreshMs,
      isSystemDashboard: dashboard.isSystemDashboard,
      isWritableBy: dashboard.isWritableBy,
      // Share permissions if expanded
      sharePermissions: dashboard.sharePermissions?.map((permission: any) => ({
        id: permission.id,
        type: permission.type,
        project: permission.project ? {
          id: permission.project.id,
          key: permission.project.key,
          name: permission.project.name,
          projectTypeKey: permission.project.projectTypeKey,
          avatarUrls: permission.project.avatarUrls
        } : null,
        role: permission.role ? {
          id: permission.role.id,
          name: permission.role.name,
          description: permission.role.description
        } : null,
        group: permission.group ? {
          name: permission.group.name,
          groupId: permission.group.groupId,
          self: permission.group.self
        } : null,
        user: permission.user ? {
          accountId: permission.user.accountId,
          displayName: permission.user.displayName,
          emailAddress: permission.user.emailAddress,
          avatarUrls: permission.user.avatarUrls
        } : null
      })) || [],
      // Edit permissions if expanded
      editPermissions: dashboard.editPermissions?.map((permission: any) => ({
        id: permission.id,
        type: permission.type,
        project: permission.project ? {
          id: permission.project.id,
          key: permission.project.key,
          name: permission.project.name
        } : null,
        role: permission.role ? {
          id: permission.role.id,
          name: permission.role.name,
          description: permission.role.description
        } : null,
        group: permission.group ? {
          name: permission.group.name,
          groupId: permission.group.groupId
        } : null,
        user: permission.user ? {
          accountId: permission.user.accountId,
          displayName: permission.user.displayName,
          emailAddress: permission.user.emailAddress
        } : null
      })) || [],
      // Dashboard gadgets summary
      gadgets: dashboard.gadgets?.map((gadget: any) => ({
        id: gadget.id,
        title: gadget.title,
        color: gadget.color,
        position: gadget.position ? {
          column: gadget.position.column,
          row: gadget.position.row
        } : null,
        moduleKey: gadget.moduleKey,
        uri: gadget.uri,
        properties: gadget.properties
      })) || [],
      gadgetCount: dashboard.gadgets?.length || 0
    };

    return {
      dashboard: formattedDashboard,
      success: true
    };

  } catch (error) {
    logger.error('Error getting dashboard details:', error);
    throw error;
  }
}

export const registerGetDashboardTool = (server: McpServer) => {
  server.tool(
    'getDashboard',
    'Get detailed information about a specific Jira dashboard including gadgets and permissions',
    getDashboardSchema.shape,
    async (params: GetDashboardParams, context: Record<string, any>) => {
      try {
        const result = await getDashboardImpl(params, context);
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