import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listUsers');

// Input parameter schema
export const listUsersSchema = z.object({
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(1000).optional().describe('Maximum number of users to return (default: 50, max: 1000)'),
  query: z.string().optional().describe('Search query for users (name, displayName, or email)'),
  username: z.string().optional().describe('Filter by username (deprecated, use accountId)'),
  accountId: z.string().optional().describe('Filter by specific account ID'),
  property: z.string().optional().describe('Filter by user property key'),
  includeActive: z.boolean().optional().describe('Include active users (default: true)'),
  includeInactive: z.boolean().optional().describe('Include inactive users (default: false)')
});

type ListUsersParams = z.infer<typeof listUsersSchema>;

async function listUsersImpl(params: ListUsersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Listing Jira users with parameters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.query) queryParams.append('query', params.query);
    if (params.username) queryParams.append('username', params.username);
    if (params.accountId) queryParams.append('accountId', params.accountId);
    if (params.property) queryParams.append('property', params.property);
    if (params.includeActive !== undefined) queryParams.append('includeActive', params.includeActive.toString());
    if (params.includeInactive !== undefined) queryParams.append('includeInactive', params.includeInactive.toString());

    // Use Jira API v3 for user search
    let url = `${baseUrl}/rest/api/3/users/search`;
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
      logger.error(`Jira API error (list users, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const users = await response.json();
    
    // Format users information (users is already an array)
    const formattedUsers = users?.map((user: any) => ({
      accountId: user.accountId,
      accountType: user.accountType,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      avatarUrls: user.avatarUrls,
      active: user.active,
      timeZone: user.timeZone,
      locale: user.locale,
      // User groups if available
      groups: user.groups ? {
        size: user.groups.size,
        items: user.groups.items?.map((group: any) => ({
          name: group.name,
          groupId: group.groupId,
          self: group.self
        })) || []
      } : null,
      // Application roles if available
      applicationRoles: user.applicationRoles ? {
        size: user.applicationRoles.size,
        items: user.applicationRoles.items?.map((role: any) => ({
          key: role.key,
          name: role.name,
          groups: role.groups,
          defaultGroups: role.defaultGroups,
          selectedByDefault: role.selectedByDefault,
          defined: role.defined,
          numberOfSeats: role.numberOfSeats,
          remainingSeats: role.remainingSeats,
          userCount: role.userCount,
          userCountDescription: role.userCountDescription,
          hasUnlimitedSeats: role.hasUnlimitedSeats,
          platform: role.platform
        })) || []
      } : null,
      // Additional user properties
      expand: user.expand,
      self: user.self
    })) || [];

    // Calculate user statistics
    const userStats = {
      totalUsers: formattedUsers.length,
      activeUsers: formattedUsers.filter((u: any) => u.active).length,
      inactiveUsers: formattedUsers.filter((u: any) => !u.active).length,
      usersWithEmail: formattedUsers.filter((u: any) => u.emailAddress).length,
      accountTypes: formattedUsers.reduce((acc: Record<string, number>, user: any) => {
        const type = user.accountType || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      topDomains: formattedUsers
        .filter((u: any) => u.emailAddress)
        .map((u: any) => u.emailAddress.split('@')[1])
        .reduce((acc: Record<string, number>, domain: string) => {
          acc[domain] = (acc[domain] || 0) + 1;
          return acc;
        }, {}),
      usersWithGroups: formattedUsers.filter((u: any) => u.groups && u.groups.size > 0).length
    };

    return {
      users: formattedUsers,
      statistics: userStats,
      // Pagination info (estimated since API doesn't always return pagination metadata)
      pagination: {
        startAt: params.startAt || 0,
        maxResults: params.maxResults || 50,
        total: formattedUsers.length,
        returned: formattedUsers.length
      },
      filters: params,
      success: true
    };

  } catch (error) {
    logger.error('Error listing users:', error);
    throw error;
  }
}

export const registerListUsersTool = (server: McpServer) => {
  server.tool(
    'listUsers',
    'List Jira users with advanced filtering, search capabilities, and user statistics',
    listUsersSchema.shape,
    async (params: ListUsersParams, context: Record<string, any>) => {
      try {
        const result = await listUsersImpl(params, context);
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