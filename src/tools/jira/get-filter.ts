import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getFilter');

// Input parameter schema
export const getFilterSchema = z.object({
  filterId: z.union([z.string(), z.number()]).describe('Filter ID'),
  expand: z.string().optional().describe('Expand options (e.g., "description,owner,jql,viewUrl,searchUrl,favourite,favouritedCount,sharePermissions,editPermissions,subscriptions")')
});

type GetFilterParams = z.infer<typeof getFilterSchema>;

async function getFilterImpl(params: GetFilterParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting filter details for ID: ${params.filterId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL with optional expand parameter
    let url = `${baseUrl}/rest/api/3/filter/${encodeURIComponent(params.filterId.toString())}`;
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
      logger.error(`Jira API error (get filter, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const filter = await response.json();
    
    // Format filter information
    const formattedFilter = {
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
          simplified: permission.project.simplified,
          avatarUrls: permission.project.avatarUrls
        } : null,
        role: permission.role ? {
          id: permission.role.id,
          name: permission.role.name,
          description: permission.role.description,
          actors: permission.role.actors
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
      // Subscriptions if expanded (safely handle non-array subscriptions)
      subscriptions: (() => {
        if (!filter.subscriptions || !Array.isArray(filter.subscriptions)) {
          return [];
        }
        return filter.subscriptions.map((subscription: any) => ({
          id: subscription.id,
          user: subscription.user ? {
            accountId: subscription.user.accountId,
            displayName: subscription.user.displayName,
            emailAddress: subscription.user.emailAddress
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
    };

    return {
      filter: formattedFilter,
      success: true
    };

  } catch (error) {
    logger.error('Error getting filter details:', error);
    throw error;
  }
}

export const registerGetFilterTool = (server: McpServer) => {
  server.tool(
    'getFilter',
    'Get detailed information about a specific Jira filter including permissions and subscriptions',
    getFilterSchema.shape,
    async (params: GetFilterParams, context: Record<string, any>) => {
      try {
        const result = await getFilterImpl(params, context);
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