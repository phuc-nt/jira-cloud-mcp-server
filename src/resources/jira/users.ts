import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource, createStandardResource } from '../../utils/mcp-resource.js';
import { usersListSchema, userSchema } from '../../schemas/jira.js';

const logger = Logger.getLogger('JiraResource:Users');

/**
 * Helper function to get the list of users from Jira (supports pagination)
 */
async function getUsers(config: AtlassianConfig, startAt = 0, maxResults = 20, accountId?: string, username?: string): Promise<any[]> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    // Only filter by accountId or username
    let url = `${baseUrl}/rest/api/2/user/search?startAt=${startAt}&maxResults=${maxResults}`;
    if (accountId && accountId.trim()) {
      url += `&accountId=${encodeURIComponent(accountId.trim())}`;
    } else if (username && username.trim()) {
      url += `&username=${encodeURIComponent(username.trim())}`;
    }
    logger.debug(`Getting Jira users: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const users = await response.json();
    return users;
  } catch (error) {
    logger.error(`Error getting Jira users:`, error);
    throw error;
  }
}

/**
 * Helper function to get user details from Jira
 */
async function getUser(config: AtlassianConfig, accountId: string): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    // API get user: /rest/api/2/user?accountId=...
    const url = `${baseUrl}/rest/api/2/user?accountId=${encodeURIComponent(accountId)}`;
    logger.debug(`Getting Jira user: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const user = await response.json();
    return user;
  } catch (error) {
    logger.error(`Error getting Jira user:`, error);
    throw error;
  }
}

/**
 * Register Jira user-related resources
 * @param server MCP Server instance
 */
export function registerUserResources(server: McpServer) {
  logger.info('Registering Jira user resources...');

  // Resource: List all users (chuẩn hóa metadata/schema)
  server.resource(
    'jira-users-list',
    new ResourceTemplate('jira://users', { list: undefined }),
    async (uri, params, extra) => {
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        // Lấy phân trang nếu có
        const startAt = params && params.startAt ? parseInt(Array.isArray(params.startAt) ? params.startAt[0] : params.startAt, 10) : 0;
        const maxResults = params && params.maxResults ? parseInt(Array.isArray(params.maxResults) ? params.maxResults[0] : params.maxResults, 10) : 20;
        logger.info(`Getting Jira users list: startAt=${startAt}, maxResults=${maxResults}`);
        const users = await getUsers(config, startAt, maxResults);
        // Chuẩn hóa users
        const formattedUsers = (users || []).map((user: any) => ({
          accountId: user.accountId,
          displayName: user.displayName,
          emailAddress: user.emailAddress,
          active: user.active,
          avatarUrl: user.avatarUrls?.['48x48'] || '',
          timeZone: user.timeZone,
          locale: user.locale
        }));
        // Trả về resource chuẩn hóa
        return createStandardResource(
          uri.href,
          formattedUsers,
          'users',
          usersListSchema,
          formattedUsers.length,
          maxResults,
          startAt,
          `${config.baseUrl}/jira/people`
        );
      } catch (error) {
        logger.error('Error getting Jira users:', error);
        throw error;
      }
    }
  );

  // Resource: User details
  server.resource(
    'jira-user-details',
    new ResourceTemplate('jira://users/{accountId}', { list: undefined }),
    async (uri, { accountId }, extra) => {
      let normalizedAccountId = '';
      try {
        // Get config from context or env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback to env
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        if (!accountId) {
          throw new Error('Missing accountId in URI');
        }
        normalizedAccountId = Array.isArray(accountId) ? accountId[0] : accountId;
        logger.info(`Getting details for Jira user: ${normalizedAccountId}`);
        const user = await getUser(config, normalizedAccountId);
        // Format returned data
        const formattedUser = {
          accountId: user.accountId,
          displayName: user.displayName,
          emailAddress: user.emailAddress,
          active: user.active,
          avatarUrl: user.avatarUrls?.['48x48'] || '',
          timeZone: user.timeZone,
          locale: user.locale
        };
        // Chuẩn hóa metadata/schema cho resource chi tiết user
        return createStandardResource(
          uri.href,
          [formattedUser],
          'user',
          userSchema,
          1,
          1,
          0,
          user.self || ''
        );
      } catch (error) {
        logger.error(`Error getting Jira user ${normalizedAccountId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of assignable users for a project
  server.resource(
    'jira-users-assignable',
    new ResourceTemplate('jira://users/assignable/{projectKey}', { list: undefined }),
    async (uri, { projectKey }, extra) => {
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        if (!projectKey) throw new Error('Missing projectKey');
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
        const headers = {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MCP-Atlassian-Server/1.0.0'
        };
        let baseUrl = config.baseUrl;
        if (!baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
        const projectKeyStr = Array.isArray(projectKey) ? projectKey[0] : projectKey;
        const url = `${baseUrl}/rest/api/3/user/assignable/search?project=${encodeURIComponent(projectKeyStr)}`;
        logger.info(`Getting assignable users for project ${projectKeyStr}: ${url}`);
        const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
        if (!response.ok) {
          const statusCode = response.status;
          const responseText = await response.text();
          logger.error(`Jira API error (${statusCode}):`, responseText);
          throw new Error(`Jira API error: ${responseText}`);
        }
        const users = await response.json();
        const formattedUsers = (users || []).map((user: any) => ({
          accountId: user.accountId,
          displayName: user.displayName,
          emailAddress: user.emailAddress,
          active: user.active,
          avatarUrl: user.avatarUrls?.['48x48'] || '',
        }));
        // Chuẩn hóa metadata/schema
        return createStandardResource(
          uri.href,
          formattedUsers,
          'users',
          usersListSchema,
          formattedUsers.length,
          formattedUsers.length,
          0,
          `${config.baseUrl}/jira/people`
        );
      } catch (error) {
        logger.error(`Error getting assignable users for project:`, error);
        throw error;
      }
    }
  );

  // Resource: List of users by role in a project
  server.resource(
    'jira-users-role',
    new ResourceTemplate('jira://users/role/{projectKey}/{roleId}', { list: undefined }),
    async (uri, { projectKey, roleId }, extra) => {
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        if (!projectKey || !roleId) throw new Error('Missing projectKey or roleId');
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
        const headers = {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MCP-Atlassian-Server/1.0.0'
        };
        let baseUrl = config.baseUrl;
        if (!baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
        const projectKeyStr = Array.isArray(projectKey) ? projectKey[0] : projectKey;
        const roleIdStr = Array.isArray(roleId) ? roleId[0] : roleId;
        const url = `${baseUrl}/rest/api/3/project/${encodeURIComponent(projectKeyStr)}/role/${encodeURIComponent(roleIdStr)}`;
        logger.info(`Getting users in role ${roleIdStr} for project ${projectKeyStr}: ${url}`);
        const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
        if (!response.ok) {
          const statusCode = response.status;
          const responseText = await response.text();
          logger.error(`Jira API error (${statusCode}):`, responseText);
          throw new Error(`Jira API error: ${responseText}`);
        }
        const data = await response.json();
        // Get users from actors
        const users = (data.actors || []).filter((a: any) => a.type === 'atlassian-user');
        const formattedUsers = users.map((user: any) => ({
          accountId: user.actorUser?.accountId || user.accountId,
          displayName: user.displayName,
          active: user.active,
          avatarUrl: user.avatarUrl || user.avatarUrls?.['48x48'] || '',
        }));
        // Chuẩn hóa metadata/schema (dùng array of user object, schema là userSchema[])
        const usersRoleSchema = {
          type: "array",
          items: userSchema
        };
        return createStandardResource(
          uri.href,
          formattedUsers,
          'users',
          usersRoleSchema,
          formattedUsers.length,
          formattedUsers.length,
          0,
          `${config.baseUrl}/jira/people`
        );
      } catch (error) {
        logger.error(`Error getting users in role for project:`, error);
        throw error;
      }
    }
  );
}