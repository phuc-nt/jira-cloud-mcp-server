import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import fetch from 'cross-fetch';
import { createJsonResource, createStandardResource, registerResource } from '../../utils/mcp-resource.js';
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
    // API get user: /rest/api/3/user?accountId=...
    const url = `${baseUrl}/rest/api/3/user?accountId=${encodeURIComponent(accountId)}`;
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

  // NOTE: Resource jira://users has been removed because it requires query parameters 
  // (username or accountId) to function properly. The Jira API doesn't support
  // getting all users without at least one filter parameter.
  // Users should use more specific resources like jira://users/{accountId} or 
  // jira://users/assignable/{projectKey} instead.

  // Resource: User details
  registerResource(
    server,
    'jira-user-details',
    new ResourceTemplate('jira://users/{accountId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://users/{accountId}',
            name: 'Jira User Details',
            description: 'Get details for a specific Jira user by accountId. Replace {accountId} with the user accountId.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'Jira user details resource',
    async (params, { config, uri }) => {
      let normalizedAccountId = '';
      try {
        if (!params.accountId) {
          throw new Error('Missing accountId in URI');
        }
        normalizedAccountId = Array.isArray(params.accountId) ? params.accountId[0] : params.accountId;
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
          uri,
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
  registerResource(
    server,
    'jira-users-assignable',
    new ResourceTemplate('jira://users/assignable/{projectKey}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://users/assignable/{projectKey}',
            name: 'Jira Assignable Users',
            description: 'List assignable users for a Jira project. Replace {projectKey} with the project key.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'Jira assignable users resource',
    async (params, { config, uri }) => {
      try {
        const projectKey = Array.isArray(params.projectKey) ? params.projectKey[0] : params.projectKey;
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
        const url = `${baseUrl}/rest/api/3/user/assignable/search?project=${encodeURIComponent(projectKey)}`;
        logger.info(`Getting assignable users for project ${projectKey}: ${url}`);
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
          uri,
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
  registerResource(
    server,
    'jira-users-role',
    new ResourceTemplate('jira://users/role/{projectKey}/{roleId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://users/role/{projectKey}/{roleId}',
            name: 'Jira Users by Role',
            description: 'List users by role in a Jira project. Replace {projectKey} and {roleId} with the project key and role ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'Jira users by role resource',
    async (params, { config, uri }) => {
      try {
        const projectKey = Array.isArray(params.projectKey) ? params.projectKey[0] : params.projectKey;
        const roleId = Array.isArray(params.roleId) ? params.roleId[0] : params.roleId;
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
        const url = `${baseUrl}/rest/api/3/project/${encodeURIComponent(projectKey)}/role/${encodeURIComponent(roleId)}`;
        logger.info(`Getting users in role for project ${projectKey}, role ${roleId}: ${url}`);
        const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
        if (!response.ok) {
          const statusCode = response.status;
          const responseText = await response.text();
          logger.error(`Jira API error (${statusCode}):`, responseText);
          throw new Error(`Jira API error: ${responseText}`);
        }
        const roleData = await response.json();
        const actors = roleData.actors || [];
        const formattedUsers = actors.filter((actor: any) => actor.type === 'atlassian-user-role-actor').map((user: any) => ({
          accountId: user.actorUser?.accountId || '',
          displayName: user.displayName,
          emailAddress: user.actorUser?.email || '',
          active: user.actorUser?.active ?? true,
          avatarUrl: user.avatarUrl || user.avatarUrls?.['48x48'] || '',
        }));
        // Chuẩn hóa metadata/schema (dùng array of user object, schema là userSchema[])
        const usersRoleSchema = {
          type: "array",
          items: userSchema
        };
        return createStandardResource(
          uri,
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