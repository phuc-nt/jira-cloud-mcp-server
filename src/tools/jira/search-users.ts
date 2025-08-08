import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:searchUsers');

// Input parameter schema
export const searchUsersSchema = z.object({
  query: z.string().describe('Search query for finding users (name, email, etc.)'),
  projectKey: z.string().optional().describe('Restrict search to users assignable to issues in this project'),
  issueKey: z.string().optional().describe('Restrict search to users assignable to this specific issue'),
  maxResults: z.number().default(50).describe('Maximum number of users to return (default: 50)')
});

type SearchUsersParams = z.infer<typeof searchUsersSchema>;

async function searchUsersImpl(params: SearchUsersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Searching users with query: ${params.query}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build search URL with parameters
    const searchParams = new URLSearchParams({
      query: params.query,
      maxResults: params.maxResults.toString()
    });

    if (params.projectKey) {
      searchParams.append('project', params.projectKey);
    }

    if (params.issueKey) {
      searchParams.append('issueKey', params.issueKey);
    }

    const url = `${baseUrl}/rest/api/3/user/search?${searchParams}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (search users, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const users = await response.json();
    
    // Format user search results
    const formattedUsers = users.map((user: any) => ({
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
      } : null
    }));

    return {
      users: formattedUsers,
      total: formattedUsers.length,
      query: params.query,
      filters: {
        projectKey: params.projectKey || null,
        issueKey: params.issueKey || null
      },
      maxResults: params.maxResults,
      success: true
    };

  } catch (error) {
    logger.error('Error searching users:', error);
    throw error;
  }
}

export const registerSearchUsersTool = (server: McpServer) => {
  server.tool(
    'searchUsers',
    'Search for Jira users by name, email, or other criteria with optional project/issue filtering',
    searchUsersSchema.shape,
    async (params: SearchUsersParams, context: Record<string, any>) => {
      try {
        const result = await searchUsersImpl(params, context);
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
                query: params.query
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};