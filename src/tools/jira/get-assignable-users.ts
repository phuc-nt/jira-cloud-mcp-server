import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getAssignableUsers');

// Input parameter schema
export const getAssignableUsersSchema = z.object({
  query: z.string().optional().describe('Search query for users (name, displayName, or email)'),
  sessionId: z.string().optional().describe('Session ID for context-specific assignment (deprecated)'),
  username: z.string().optional().describe('Filter by username (deprecated, use accountId)'),
  project: z.string().optional().describe('Project key to get assignable users for this specific project'),
  issueKey: z.string().optional().describe('Issue key to get assignable users for this specific issue'),
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(1000).optional().describe('Maximum number of users to return (default: 50, max: 1000)'),
  actionDescriptorId: z.number().optional().describe('Action descriptor ID for workflow context')
});

type GetAssignableUsersParams = z.infer<typeof getAssignableUsersSchema>;

async function getAssignableUsersImpl(params: GetAssignableUsersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Getting assignable users with parameters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.query) queryParams.append('query', params.query);
    if (params.sessionId) queryParams.append('sessionId', params.sessionId);
    if (params.username) queryParams.append('username', params.username);
    if (params.project) queryParams.append('project', params.project);
    if (params.issueKey) queryParams.append('issueKey', params.issueKey);
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.actionDescriptorId !== undefined) queryParams.append('actionDescriptorId', params.actionDescriptorId.toString());

    // Use Jira API v3 for assignable users search
    let url = `${baseUrl}/rest/api/3/user/assignable/search`;
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
      logger.error(`Jira API error (get assignable users, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const users = await response.json();
    
    // Format assignable users information (users is already an array)
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

    // Calculate user assignment statistics
    const assignmentStats = {
      totalAssignableUsers: formattedUsers.length,
      activeAssignableUsers: formattedUsers.filter((u: any) => u.active).length,
      inactiveAssignableUsers: formattedUsers.filter((u: any) => !u.active).length,
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
      usersWithGroups: formattedUsers.filter((u: any) => u.groups && u.groups.size > 0).length,
      timeZoneDistribution: formattedUsers
        .filter((u: any) => u.timeZone)
        .reduce((acc: Record<string, number>, user: any) => {
          const timeZone = user.timeZone || 'unknown';
          acc[timeZone] = (acc[timeZone] || 0) + 1;
          return acc;
        }, {})
    };

    return {
      assignableUsers: formattedUsers,
      assignmentStatistics: assignmentStats,
      // Context information
      context: {
        project: params.project,
        issueKey: params.issueKey,
        actionDescriptorId: params.actionDescriptorId
      },
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
    logger.error('Error getting assignable users:', error);
    throw error;
  }
}

export const registerGetAssignableUsersTool = (server: McpServer) => {
  server.tool(
    'getAssignableUsers',
    'Get users that can be assigned to issues in Jira with context-specific filtering and comprehensive statistics',
    getAssignableUsersSchema.shape,
    async (params: GetAssignableUsersParams, context: Record<string, any>) => {
      try {
        const result = await getAssignableUsersImpl(params, context);
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