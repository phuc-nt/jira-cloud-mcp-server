import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraResource:Issues');

/**
 * Hàm helper để lấy thông tin chi tiết issue từ Jira
 */
async function getIssue(config: AtlassianConfig, issueKey: string): Promise<any> {
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
    const url = `${baseUrl}/rest/api/2/issue/${issueKey}`;
    logger.debug(`Getting Jira issue: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const issue = await response.json();
    return issue;
  } catch (error) {
    logger.error(`Error getting Jira issue ${issueKey}:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách issues từ Jira (hỗ trợ phân trang)
 */
async function getIssues(config: AtlassianConfig, startAt = 0, maxResults = 20): Promise<any> {
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
    const url = `${baseUrl}/rest/api/2/search?startAt=${startAt}&maxResults=${maxResults}`;
    logger.debug(`Getting Jira issues: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error getting Jira issues:`, error);
    throw error;
  }
}

/**
 * Hàm helper để tìm kiếm issues theo JQL từ Jira (hỗ trợ phân trang)
 */
async function searchIssuesByJql(config: AtlassianConfig, jql: string, startAt = 0, maxResults = 20): Promise<any> {
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
    const url = `${baseUrl}/rest/api/2/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}`;
    logger.debug(`Searching Jira issues by JQL: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error searching Jira issues by JQL:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách transitions của một issue từ Jira
 */
async function getIssueTransitions(config: AtlassianConfig, issueKey: string): Promise<any> {
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
    const url = `${baseUrl}/rest/api/2/issue/${issueKey}/transitions`;
    logger.debug(`Getting Jira issue transitions: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const data = await response.json();
    return data.transitions || [];
  } catch (error) {
    logger.error(`Error getting Jira issue transitions:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách comments của một issue từ Jira
 */
async function getIssueComments(config: AtlassianConfig, issueKey: string): Promise<any[]> {
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
    const url = `${baseUrl}/rest/api/2/issue/${issueKey}/comment`;
    logger.debug(`Getting Jira issue comments: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Jira API error (${statusCode}):`, responseText);
      throw new Error(`Jira API error: ${responseText}`);
    }
    const data = await response.json();
    return data.comments || [];
  } catch (error) {
    logger.error(`Error getting Jira issue comments:`, error);
    throw error;
  }
}

/**
 * Đăng ký các resources liên quan đến Jira issues
 * @param server MCP Server instance
 */
export function registerIssueResources(server: McpServer) {
  logger.info('Registering Jira issue resources...');

  // Resource: Thông tin chi tiết về một issue
  server.resource(
    'jira-issue-details',
    new ResourceTemplate('jira://issues/{issueKey}', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
      try {
        // Lấy config từ context hoặc env (tương tự các resource khác)
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
        if (!issueKey) {
          throw new Error('Thiếu issueKey trong URI');
        }
        // Đảm bảo issueKey là string
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting details for Jira issue: ${normalizedIssueKey}`);
        const issue = await getIssue(config, normalizedIssueKey);
        // Định dạng lại dữ liệu trả về
        const formattedIssue = {
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name || 'Unknown',
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          reporter: issue.fields.reporter?.displayName || 'Unknown',
          description: issue.fields.description || '',
          url: `${config.baseUrl}/browse/${issue.key}`
        };
        return createJsonResource(uri.href, {
          issue: formattedIssue,
          message: `Thông tin chi tiết issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách tất cả issues (hỗ trợ phân trang)
  server.resource(
    'jira-issues-list',
    new ResourceTemplate('jira://issues', { list: undefined }),
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
        logger.info(`Getting Jira issues list: startAt=${startAt}, maxResults=${maxResults}`);
        const data = await getIssues(config, startAt, maxResults);
        // Định dạng lại danh sách issues
        const formattedIssues = (data.issues || []).map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name || 'Unknown',
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          url: `${config.baseUrl}/browse/${issue.key}`
        }));
        return createJsonResource(uri.href, {
          issues: formattedIssues,
          total: data.total,
          startAt: data.startAt,
          maxResults: data.maxResults,
          message: `Tìm thấy ${data.total} issues, hiển thị từ ${data.startAt + 1} đến ${data.startAt + formattedIssues.length}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issues list:`, error);
        throw error;
      }
    }
  );

  // Resource: Tìm kiếm issues theo JQL (hỗ trợ phân trang)
  server.resource(
    'jira-issues-search-jql',
    new ResourceTemplate('jira://issues?jql={jql}', { list: undefined }),
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
        // Lấy tham số JQL và phân trang
        const jql = params && params.jql ? (Array.isArray(params.jql) ? params.jql[0] : params.jql) : '';
        if (!jql) {
          throw new Error('Thiếu tham số jql trong URI');
        }
        const startAt = params && params.startAt ? parseInt(Array.isArray(params.startAt) ? params.startAt[0] : params.startAt, 10) : 0;
        const maxResults = params && params.maxResults ? parseInt(Array.isArray(params.maxResults) ? params.maxResults[0] : params.maxResults, 10) : 20;
        logger.info(`Searching Jira issues by JQL: jql="${jql}", startAt=${startAt}, maxResults=${maxResults}`);
        const data = await searchIssuesByJql(config, jql, startAt, maxResults);
        // Định dạng lại danh sách issues
        const formattedIssues = (data.issues || []).map((issue: any) => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status?.name || 'Unknown',
          assignee: issue.fields.assignee?.displayName || 'Unassigned',
          url: `${config.baseUrl}/browse/${issue.key}`
        }));
        return createJsonResource(uri.href, {
          issues: formattedIssues,
          total: data.total,
          startAt: data.startAt,
          maxResults: data.maxResults,
          message: `Tìm thấy ${data.total} issues theo JQL, hiển thị từ ${data.startAt + 1} đến ${data.startAt + formattedIssues.length}`
        });
      } catch (error) {
        logger.error(`Error searching Jira issues by JQL:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách transitions của một issue
  server.resource(
    'jira-issue-transitions',
    new ResourceTemplate('jira://issues/{issueKey}/transitions', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
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
        if (!issueKey) {
          throw new Error('Thiếu issueKey trong URI');
        }
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting transitions for Jira issue: ${normalizedIssueKey}`);
        const transitions = await getIssueTransitions(config, normalizedIssueKey);
        // Định dạng lại danh sách transitions
        const formattedTransitions = transitions.map((t: any) => ({
          id: t.id,
          name: t.name,
          to: t.to?.name || '',
          description: t.to?.description || ''
        }));
        return createJsonResource(uri.href, {
          transitions: formattedTransitions,
          count: formattedTransitions.length,
          message: `Có ${formattedTransitions.length} trạng thái có thể chuyển cho issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue transitions for ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách comments của một issue
  server.resource(
    'jira-issue-comments',
    new ResourceTemplate('jira://issues/{issueKey}/comments', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
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
        if (!issueKey) {
          throw new Error('Thiếu issueKey trong URI');
        }
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting comments for Jira issue: ${normalizedIssueKey}`);
        const comments = await getIssueComments(config, normalizedIssueKey);
        // Định dạng lại danh sách comments
        const formattedComments = comments.map((c: any) => ({
          id: c.id,
          author: c.author?.displayName || '',
          body: c.body,
          created: c.created,
          updated: c.updated
        }));
        return createJsonResource(uri.href, {
          comments: formattedComments,
          count: formattedComments.length,
          message: `Có ${formattedComments.length} bình luận cho issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue comments for ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );
}
