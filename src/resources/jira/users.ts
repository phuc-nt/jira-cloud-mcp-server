import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraResource:Users');

/**
 * Hàm helper để lấy danh sách users từ Jira (hỗ trợ phân trang)
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
    // Chỉ filter theo accountId hoặc username
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
 * Hàm helper để lấy thông tin chi tiết user từ Jira
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
 * Đăng ký các resources liên quan đến Jira users
 * @param server MCP Server instance
 */
export function registerUserResources(server: McpServer) {
  logger.info('Registering Jira user resources...');

  // Resource: Thông tin chi tiết user
  server.resource(
    'jira-user-details',
    new ResourceTemplate('jira://users/{accountId}', { list: undefined }),
    async (uri, { accountId }, extra) => {
      let normalizedAccountId = '';
      try {
        // Lấy config từ context hoặc env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback lấy từ env
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
          throw new Error('Thiếu accountId trong URI');
        }
        normalizedAccountId = Array.isArray(accountId) ? accountId[0] : accountId;
        logger.info(`Getting details for Jira user: ${normalizedAccountId}`);
        const user = await getUser(config, normalizedAccountId);
        // Định dạng lại dữ liệu trả về
        const formattedUser = {
          accountId: user.accountId,
          displayName: user.displayName,
          emailAddress: user.emailAddress,
          active: user.active,
          avatarUrl: user.avatarUrls?.['48x48'] || '',
          timeZone: user.timeZone,
          locale: user.locale
        };
        return createJsonResource(uri.href, {
          user: formattedUser,
          message: `Thông tin chi tiết user ${normalizedAccountId}`
        });
      } catch (error) {
        logger.error(`Error getting Jira user ${normalizedAccountId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách user assignable cho project
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
        if (!projectKey) throw new Error('Thiếu projectKey');
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
        return createJsonResource(uri.href, {
          users: formattedUsers,
          count: formattedUsers.length,
          projectKey,
          message: `Có ${formattedUsers.length} user assignable cho project ${projectKey}`
        });
      } catch (error) {
        logger.error(`Error getting assignable users for project:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách user theo role trong project
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
        if (!projectKey || !roleId) throw new Error('Thiếu projectKey hoặc roleId');
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
        // Lấy user từ actors
        const users = (data.actors || []).filter((a: any) => a.type === 'atlassian-user');
        const formattedUsers = users.map((user: any) => ({
          accountId: user.actorUser?.accountId || user.accountId,
          displayName: user.displayName,
          active: user.active,
          avatarUrl: user.avatarUrl || user.avatarUrls?.['48x48'] || '',
        }));
        return createJsonResource(uri.href, {
          users: formattedUsers,
          count: formattedUsers.length,
          projectKey,
          roleId,
          message: `Có ${formattedUsers.length} user trong role ${roleId} của project ${projectKey}`
        });
      } catch (error) {
        logger.error(`Error getting users in role for project:`, error);
        throw error;
      }
    }
  );
}