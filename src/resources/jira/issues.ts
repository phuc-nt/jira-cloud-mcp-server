import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraResource:Issues');

/**
 * Helper function to get issue details from Jira
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
 * Helper function to get a list of issues from Jira (supports pagination)
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
 * Helper function to search issues by JQL from Jira (supports pagination)
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
 * Helper function to get a list of transitions for an issue from Jira
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
 * Helper function to get a list of comments for an issue from Jira
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
 * Register resources related to Jira issues
 * @param server MCP Server instance
 */
export function registerIssueResources(server: McpServer) {
  logger.info('Registering Jira issue resources...');

  // Resource: Issue details
  server.resource(
    'jira-issue-details',
    new ResourceTemplate('jira://issues/{issueKey}', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
      try {
        // Get config from context or env (similar to other resources)
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
        if (!issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        // Ensure issueKey is a string
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting details for Jira issue: ${normalizedIssueKey}`);
        const issue = await getIssue(config, normalizedIssueKey);
        // Format returned data
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
          message: `Details of issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: List all issues (supports pagination)
  server.resource(
    'jira-issues-list',
    new ResourceTemplate('jira://issues', { list: undefined }),
    async (uri, params, extra) => {
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
        // Get pagination params if any
        const startAt = params && params.startAt ? parseInt(Array.isArray(params.startAt) ? params.startAt[0] : params.startAt, 10) : 0;
        const maxResults = params && params.maxResults ? parseInt(Array.isArray(params.maxResults) ? params.maxResults[0] : params.maxResults, 10) : 20;
        logger.info(`Getting Jira issues list: startAt=${startAt}, maxResults=${maxResults}`);
        const data = await getIssues(config, startAt, maxResults);
        // Format issues list
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
          message: `Found ${data.total} issues, displaying from ${data.startAt + 1} to ${data.startAt + formattedIssues.length}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issues list:`, error);
        throw error;
      }
    }
  );

  // Resource: Search issues by JQL (supports pagination)
  server.resource(
    'jira-issues-search-jql',
    new ResourceTemplate('jira://issues?jql={jql}', { list: undefined }),
    async (uri, params, extra) => {
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
        // Get JQL and pagination params
        let jql = params && params.jql ? (Array.isArray(params.jql) ? params.jql[0] : params.jql) : '';
        if (!jql) {
          throw new Error('Missing jql parameter in URI');
        }
        // Đảm bảo JQL là raw text, nếu đã encode thì decode trước
        try { jql = decodeURIComponent(jql); } catch {}
        const startAt = params && params.startAt ? parseInt(Array.isArray(params.startAt) ? params.startAt[0] : params.startAt, 10) : 0;
        const maxResults = params && params.maxResults ? parseInt(Array.isArray(params.maxResults) ? params.maxResults[0] : params.maxResults, 10) : 20;
        logger.info(`Searching Jira issues by JQL: jql="${jql}", startAt=${startAt}, maxResults=${maxResults}`);
        const data = await searchIssuesByJql(config, jql, startAt, maxResults);
        // Format issues list
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
          message: `Found ${data.total} issues by JQL, displaying from ${data.startAt + 1} to ${data.startAt + formattedIssues.length}`
        });
      } catch (error) {
        logger.error(`Error searching Jira issues by JQL:`, error);
        throw error;
      }
    }
  );

  // Resource: List transitions of an issue
  server.resource(
    'jira-issue-transitions',
    new ResourceTemplate('jira://issues/{issueKey}/transitions', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
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
        if (!issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting transitions for Jira issue: ${normalizedIssueKey}`);
        const transitions = await getIssueTransitions(config, normalizedIssueKey);
        // Format transitions list
        const formattedTransitions = transitions.map((t: any) => ({
          id: t.id,
          name: t.name,
          to: t.to?.name || '',
          description: t.to?.description || ''
        }));
        return createJsonResource(uri.href, {
          transitions: formattedTransitions,
          count: formattedTransitions.length,
          message: `There are ${formattedTransitions.length} possible transitions for issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue transitions for ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: List comments of an issue
  server.resource(
    'jira-issue-comments',
    new ResourceTemplate('jira://issues/{issueKey}/comments', { list: undefined }),
    async (uri, { issueKey }, extra) => {
      let normalizedIssueKey = '';
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
        if (!issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        normalizedIssueKey = Array.isArray(issueKey) ? issueKey[0] : issueKey;
        logger.info(`Getting comments for Jira issue: ${normalizedIssueKey}`);
        const comments = await getIssueComments(config, normalizedIssueKey);
        // Format comments list
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
          message: `There are ${formattedComments.length} comments for issue ${normalizedIssueKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira issue comments for ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );
}
