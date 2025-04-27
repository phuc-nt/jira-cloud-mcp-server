import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraResource:Users');

/**
 * Hàm helper để lấy danh sách users từ Jira (hỗ trợ phân trang)
 */
async function getUsers(config: AtlassianConfig, startAt = 0, maxResults = 20): Promise<any[]> {
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
    // API search users: /rest/api/2/user/search?startAt=0&maxResults=20
    const url = `${baseUrl}/rest/api/2/user/search?startAt=${startAt}&maxResults=${maxResults}`;
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

  // Resource: Danh sách users (hỗ trợ phân trang)
  server.resource(
    'jira-users-list',
    new ResourceTemplate('jira://users', { list: undefined }),
    async (uri, params, extra) => {
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
        // Lấy tham số phân trang nếu có
        const startAt = params && params.startAt ? parseInt(Array.isArray(params.startAt) ? params.startAt[0] : params.startAt, 10) : 0;
        const maxResults = params && params.maxResults ? parseInt(Array.isArray(params.maxResults) ? params.maxResults[0] : params.maxResults, 10) : 20;
        logger.info(`Getting Jira users list: startAt=${startAt}, maxResults=${maxResults}`);
        const users = await getUsers(config, startAt, maxResults);
        // Định dạng lại danh sách users
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
          startAt,
          maxResults,
          message: `Tìm thấy ${formattedUsers.length} users, hiển thị từ ${startAt + 1} đến ${startAt + formattedUsers.length}`
        });
      } catch (error) {
        logger.error(`Error getting Jira users list:`, error);
        throw error;
      }
    }
  );

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
}
