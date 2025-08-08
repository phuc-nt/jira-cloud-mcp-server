import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getUser');

// Input parameter schema
export const getUserSchema = z.object({
  accountId: z.string().describe('User account ID')
});

type GetUserParams = z.infer<typeof getUserSchema>;

async function getUserImpl(params: GetUserParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting user details for: ${params.accountId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Get user details
    const url = `${baseUrl}/rest/api/3/user?accountId=${encodeURIComponent(params.accountId)}&expand=groups,applicationRoles`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get user, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const user = await response.json();
    
    // Format comprehensive user information
    const formattedUser = {
      accountId: user.accountId,
      accountType: user.accountType,
      displayName: user.displayName,
      emailAddress: user.emailAddress,
      active: user.active,
      timeZone: user.timeZone,
      locale: user.locale,
      avatarUrls: user.avatarUrls ? {
        '16x16': user.avatarUrls['16x16'],
        '24x24': user.avatarUrls['24x24'],
        '32x32': user.avatarUrls['32x32'],
        '48x48': user.avatarUrls['48x48']
      } : null,
      groups: user.groups ? {
        size: user.groups.size,
        items: user.groups.items?.map((group: any) => ({
          name: group.name,
          groupId: group.groupId
        })) || []
      } : null,
      applicationRoles: user.applicationRoles ? {
        size: user.applicationRoles.size,
        items: user.applicationRoles.items?.map((role: any) => ({
          key: role.key,
          name: role.name,
          platform: role.platform,
          userCount: role.userCount,
          groupCount: role.groupCount,
          defaultGroups: role.defaultGroups
        })) || []
      } : null,
      expand: user.expand
    };

    return {
      user: formattedUser,
      success: true
    };

  } catch (error) {
    logger.error('Error getting user:', error);
    throw error;
  }
}

export const registerGetUserTool = (server: McpServer) => {
  server.tool(
    'getUser',
    'Get detailed information about a specific Jira user by account ID',
    getUserSchema.shape,
    async (params: GetUserParams, context: Record<string, any>) => {
      try {
        const result = await getUserImpl(params, context);
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
                accountId: params.accountId
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};