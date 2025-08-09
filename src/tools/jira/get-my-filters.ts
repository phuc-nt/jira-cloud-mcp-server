import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getMyFilters');

// Input parameter schema
export const getMyFiltersSchema = z.object({
  includeFavourites: z.boolean().optional().describe('Include favourite filters (default: true)'),
  expand: z.string().optional().describe('Expand options (e.g., "description,owner,jql,viewUrl,searchUrl,favourite,favouritedCount,sharePermissions,editPermissions,subscriptions")')
});

type GetMyFiltersParams = z.infer<typeof getMyFiltersSchema>;

async function getMyFiltersImpl(params: GetMyFiltersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Getting current user filters');

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.includeFavourites !== undefined) queryParams.append('includeFavourites', params.includeFavourites.toString());
    if (params.expand) queryParams.append('expand', params.expand);

    // Use Jira API v3 for my filters
    let url = `${baseUrl}/rest/api/3/filter/my`;
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
      logger.error(`Jira API error (get my filters, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const filters = await response.json();
    
    // Format filters information (filters is already an array)
    const formattedFilters = filters?.map((filter: any) => ({
      id: filter.id,
      self: filter.self,
      name: filter.name,
      description: filter.description,
      owner: filter.owner ? {
        accountId: filter.owner.accountId,
        displayName: filter.owner.displayName,
        emailAddress: filter.owner.emailAddress,
        avatarUrls: filter.owner.avatarUrls,
        active: filter.owner.active,
        timeZone: filter.owner.timeZone,
        locale: filter.owner.locale
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
      // Subscriptions if expanded (safely handle non-array subscriptions)
      subscriptions: (() => {
        if (!filter.subscriptions || !Array.isArray(filter.subscriptions)) {
          return [];
        }
        return filter.subscriptions.map((subscription: any) => ({
          id: subscription.id,
          user: subscription.user ? {
            accountId: subscription.user.accountId,
            displayName: subscription.user.displayName
          } : null,
          group: subscription.group ? {
            name: subscription.group.name,
            groupId: subscription.group.groupId
          } : null,
          emailRecipient: subscription.emailRecipient
        }));
      })(),
      // Additional metadata
      approximateLastUsed: filter.approximateLastUsed
    })) || [];

    // Categorize filters
    const myFilters = formattedFilters.filter((f: any) => f.owner?.emailAddress === config.email);
    const favouriteFilters = formattedFilters.filter((f: any) => f.favourite);
    
    // Calculate statistics
    const filterStats = {
      totalFilters: formattedFilters.length,
      myFiltersCount: myFilters.length,
      favouriteFiltersCount: favouriteFilters.length,
      mostFavourited: formattedFilters
        .sort((a: any, b: any) => (b.favouritedCount || 0) - (a.favouritedCount || 0))[0] || null,
      recentlyUsed: formattedFilters
        .filter((f: any) => f.approximateLastUsed)
        .sort((a: any, b: any) => new Date(b.approximateLastUsed).getTime() - new Date(a.approximateLastUsed).getTime())
        .slice(0, 5)
    };

    return {
      filters: formattedFilters,
      categorized: {
        myFilters,
        favouriteFilters,
        sharedWithMe: formattedFilters.filter((f: any) => f.owner?.emailAddress !== config.email)
      },
      statistics: filterStats,
      parameters: params,
      success: true
    };

  } catch (error) {
    logger.error('Error getting my filters:', error);
    throw error;
  }
}

export const registerGetMyFiltersTool = (server: McpServer) => {
  server.tool(
    'getMyFilters',
    'Get current user\'s filters including owned, favourite, and shared filters with statistics',
    getMyFiltersSchema.shape,
    async (params: GetMyFiltersParams, context: Record<string, any>) => {
      try {
        const result = await getMyFiltersImpl(params, context);
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