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
}
