import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listDashboards');

// Input parameter schema
export const listDashboardsSchema = z.object({
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of dashboards to return (default: 20, max: 100)'),
  filter: z.enum(['my', 'favourite']).optional().describe('Filter dashboards (my = owned by current user, favourite = favourited)'),
  expand: z.string().optional().describe('Expand options for dashboards')
});

type ListDashboardsParams = z.infer<typeof listDashboardsSchema>;

async function listDashboardsImpl(params: ListDashboardsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Listing Jira dashboards with filters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.filter) queryParams.append('filter', params.filter);
    if (params.expand) queryParams.append('expand', params.expand);

    // Use Jira API v3 for dashboard listing
    let url = `${baseUrl}/rest/api/3/dashboard`;
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
      logger.error(`Jira API error (list dashboards, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format dashboards information
    const dashboards = data.dashboards?.map((dashboard: any) => ({
      id: dashboard.id,
      self: dashboard.self,
      name: dashboard.name,
      description: dashboard.description,
      owner: dashboard.owner ? {
        accountId: dashboard.owner.accountId,
        displayName: dashboard.owner.displayName,
        emailAddress: dashboard.owner.emailAddress,
        avatarUrls: dashboard.owner.avatarUrls,
        active: dashboard.owner.active
      } : null,
      view: dashboard.view,
      popularity: dashboard.popularity,
      favourite: dashboard.favourite,
      // Gadgets count if available
      gadgetCount: dashboard.gadgets?.length || 0,
      // Additional dashboard properties
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
          name: permission.project.name
        } : null,
        role: permission.role ? {
          id: permission.role.id,
          name: permission.role.name
        } : null,
        group: permission.group ? {
          name: permission.group.name,
          groupId: permission.group.groupId
        } : null,
        user: permission.user ? {
          accountId: permission.user.accountId,
          displayName: permission.user.displayName
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
          name: permission.role.name
        } : null,
        group: permission.group ? {
          name: permission.group.name,
          groupId: permission.group.groupId
        } : null,
        user: permission.user ? {
          accountId: permission.user.accountId,
          displayName: permission.user.displayName
        } : null
      })) || []
    })) || [];

    // Calculate dashboard statistics
    const dashboardStats = {
      totalDashboards: dashboards.length,
      myDashboards: dashboards.filter((d: any) => d.owner?.emailAddress === config.email).length,
      favouriteDashboards: dashboards.filter((d: any) => d.favourite).length,
      systemDashboards: dashboards.filter((d: any) => d.isSystemDashboard).length,
      averageGadgets: dashboards.length > 0 ? 
        (dashboards.reduce((sum: number, d: any) => sum + (d.gadgetCount || 0), 0) / dashboards.length).toFixed(1) : 0,
      mostPopular: dashboards
        .sort((a: any, b: any) => (b.popularity || 0) - (a.popularity || 0))[0] || null
    };

    return {
      dashboards,
      statistics: dashboardStats,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 20,
        total: data.total || dashboards.length,
        isLast: data.isLast !== undefined ? data.isLast : (data.startAt + data.maxResults >= data.total)
      },
      totalDashboards: data.total || dashboards.length,
      filters: params,
      success: true
    };

  } catch (error) {
    logger.error('Error listing dashboards:', error);
    throw error;
  }
}

export const registerListDashboardsTool = (server: McpServer) => {
  server.tool(
    'listDashboards',
    'List Jira dashboards with optional filtering by ownership, favourites, and pagination',
    listDashboardsSchema.shape,
    async (params: ListDashboardsParams, context: Record<string, any>) => {
      try {
        const result = await listDashboardsImpl(params, context);
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