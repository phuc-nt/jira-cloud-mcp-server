import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listFilters');

// Input parameter schema
export const listFiltersSchema = z.object({
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of filters to return (default: 50, max: 100)'),
  filterName: z.string().optional().describe('Filter by filter name (partial match)'),
  accountId: z.string().optional().describe('Filter by owner account ID'),
  owner: z.string().optional().describe('Filter by owner username (deprecated, use accountId)'),
  groupname: z.string().optional().describe('Filter by group name'),
  groupId: z.string().optional().describe('Filter by group ID'),
  projectId: z.union([z.string(), z.number()]).optional().describe('Filter by project ID'),
  id: z.array(z.union([z.string(), z.number()])).optional().describe('Filter by specific filter IDs'),
  orderBy: z.enum(['description', '-description', 'favourite_count', '-favourite_count', 'id', '-id', 'is_favourite', '-is_favourite', 'name', '-name', 'owner', '-owner']).optional().describe('Sort order (default: name)'),
  expand: z.string().optional().describe('Expand options (e.g., "description,owner,jql,viewUrl,searchUrl,favourite,favouritedCount,sharePermissions,editPermissions,subscriptions")')
});

type ListFiltersParams = z.infer<typeof listFiltersSchema>;

async function listFiltersImpl(params: ListFiltersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Listing Jira filters with parameters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.filterName) queryParams.append('filterName', params.filterName);
    if (params.accountId) queryParams.append('accountId', params.accountId);
    if (params.owner) queryParams.append('owner', params.owner);
    if (params.groupname) queryParams.append('groupname', params.groupname);
    if (params.groupId) queryParams.append('groupId', params.groupId);
    if (params.projectId) queryParams.append('projectId', params.projectId.toString());
    if (params.id && params.id.length > 0) {
      params.id.forEach(filterId => queryParams.append('id', filterId.toString()));
    }
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.expand) queryParams.append('expand', params.expand);

    // Use Jira API v3 for filter search
    let url = `${baseUrl}/rest/api/3/filter/search`;
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
      logger.error(`Jira API error (list filters, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format filters information
    const filters = data.values?.map((filter: any) => ({
      id: filter.id,
      self: filter.self,
      name: filter.name,
      description: filter.description,
      owner: filter.owner ? {
        accountId: filter.owner.accountId,
        displayName: filter.owner.displayName,
        emailAddress: filter.owner.emailAddress,
        avatarUrls: filter.owner.avatarUrls,
        active: filter.owner.active
      } : null,
      jql: filter.jql,
      viewUrl: filter.viewUrl,
      searchUrl: filter.searchUrl,
      favourite: filter.favourite,
      favouritedCount: filter.favouritedCount,
      // Share permissions if expanded
      sharePermissions: filter.sharePermissions?.map((permission: any) => ({
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
          displayName: permission.user.displayName
        } : null
      })) || [],
      // Edit permissions if expanded
      editPermissions: filter.editPermissions?.map((permission: any) => ({
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
      // Subscriptions if expanded
      subscriptions: filter.subscriptions?.map((subscription: any) => ({
        id: subscription.id,
        user: subscription.user ? {
          accountId: subscription.user.accountId,
          displayName: subscription.user.displayName
        } : null,
        group: subscription.group ? {
          name: subscription.group.name,
          groupId: subscription.group.groupId
        } : null
      })) || []
    })) || [];

    return {
      filters,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50,
        total: data.total || filters.length,
        isLast: data.isLast !== undefined ? data.isLast : (data.startAt + data.maxResults >= data.total)
      },
      totalFilters: data.total || filters.length,
      filters_applied: params,
      success: true
    };

  } catch (error) {
    logger.error('Error listing filters:', error);
    throw error;
  }
}

export const registerListFiltersTool = (server: McpServer) => {
  server.tool(
    'listFilters',
    'List Jira filters with advanced filtering, pagination, and permission details',
    listFiltersSchema.shape,
    async (params: ListFiltersParams, context: Record<string, any>) => {
      try {
        const result = await listFiltersImpl(params, context);
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