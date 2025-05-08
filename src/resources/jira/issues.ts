import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource, createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';
import { issueSchema, issuesListSchema, transitionsListSchema, commentsListSchema } from '../../schemas/jira.js';

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
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}`;
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
async function getIssues(config: AtlassianConfig, startAt = 0, maxResults = 20, jql = ''): Promise<any> {
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
    
    // Build URL with optional JQL
    let url = `${baseUrl}/rest/api/3/search?startAt=${startAt}&maxResults=${maxResults}`;
    if (jql && jql.trim()) {
      url += `&jql=${encodeURIComponent(jql.trim())}`;
    }
    
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
    const url = `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&startAt=${startAt}&maxResults=${maxResults}`;
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
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}/transitions`;
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
async function getIssueComments(config: AtlassianConfig, issueKey: string, startAt = 0, maxResults = 20): Promise<any> {
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
    const url = `${baseUrl}/rest/api/3/issue/${issueKey}/comment?startAt=${startAt}&maxResults=${maxResults}`;
    logger.debug(`Getting Jira issue comments: ${url}`);
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
    logger.error(`Error getting Jira issue comments:`, error);
    throw error;
  }
}

/**
 * Hàm chuyển ADF sang text thuần
 */
function extractTextFromADF(adf: any): string {
  if (!adf || typeof adf === 'string') return adf || '';
  let text = '';
  if (adf.content) {
    adf.content.forEach((node: any) => {
      if (node.type === 'paragraph' && node.content) {
        node.content.forEach((inline: any) => {
          if (inline.type === 'text') {
            text += inline.text;
          }
        });
        text += '\n';
      }
    });
  }
  return text.trim();
}

/**
 * Format Jira issue data to standardized format
 */
function formatIssueData(issue: any, baseUrl: string): any {
  return {
    id: issue.id,
    key: issue.key,
    summary: issue.fields?.summary || '',
    description: extractTextFromADF(issue.fields?.description),
    rawDescription: issue.fields?.description || null,
    status: {
      name: issue.fields?.status?.name || 'Unknown',
      id: issue.fields?.status?.id || '0'
    },
    assignee: issue.fields?.assignee ? {
      displayName: issue.fields.assignee.displayName,
      accountId: issue.fields.assignee.accountId
    } : null,
    reporter: issue.fields?.reporter ? {
      displayName: issue.fields.reporter.displayName,
      accountId: issue.fields.reporter.accountId
    } : null,
    priority: issue.fields?.priority ? {
      name: issue.fields.priority.name,
      id: issue.fields.priority.id
    } : null,
    created: issue.fields?.created || null,
    updated: issue.fields?.updated || null,
    issueType: {
      name: issue.fields?.issuetype?.name || 'Unknown',
      id: issue.fields?.issuetype?.id || '0'
    },
    projectKey: issue.fields?.project?.key || '',
    projectName: issue.fields?.project?.name || '',
    url: `${baseUrl}/browse/${issue.key}`
  };
}

/**
 * Format Jira comment data to standardized format
 */
function formatCommentData(comment: any): any {
  return {
    id: comment.id,
    body: extractTextFromADF(comment.body),
    rawBody: comment.body || '',
    author: comment.author ? {
      displayName: comment.author.displayName,
      accountId: comment.author.accountId
    } : null,
    created: comment.created || null,
    updated: comment.updated || null
  };
}

/**
 * Register resources related to Jira issues
 * @param server MCP Server instance
 */
export function registerIssueResources(server: McpServer) {
  logger.info('Registering Jira issue resources...');

  // Resource: Issues list (with pagination and JQL support)
  registerResource(
    server,
    'jira-issues-list',
    new ResourceTemplate('jira://issues', { list: undefined }),
    'List of Jira issues with pagination and JQL support',
    async (params, { config, uri }) => {
      try {
        // Extract pagination parameters
        const { limit, offset } = extractPagingParams(params);
        
        // Extract JQL if provided
        const jql = params && params.jql 
          ? (Array.isArray(params.jql) ? params.jql[0] : params.jql)
          : '';
          
        logger.info(`Getting list of Jira issues with limit=${limit}, offset=${offset}, jql=${jql || 'none'}`);
        
        // Get issues with pagination from Jira API
        const issuesData = await getIssues(config, offset, limit, jql);
        
        // Format each issue to standardized format
        const formattedIssues = (issuesData.issues || []).map((issue: any) => 
          formatIssueData(issue, config.baseUrl)
        );
        
        // Calculate total count
        const totalCount = issuesData.total || 0;
        
        // UI URL for Jira issues (filter view if JQL provided)
        const uiUrl = jql 
          ? `${config.baseUrl}/issues/?jql=${encodeURIComponent(jql)}`
          : `${config.baseUrl}/issues/`;
          
        // Return standardized resource with metadata and schema
        return createStandardResource(
          uri,
          formattedIssues,
          'issues',
          issuesListSchema,
          totalCount,
          limit,
          offset,
          uiUrl
        );
      } catch (error) {
        logger.error('Error getting Jira issues:', error);
        throw error;
      }
    }
  );

  // Resource: Issue details
  registerResource(
    server,
    'jira-issue-details',
    new ResourceTemplate('jira://issues/{issueKey}', { list: undefined }),
    'Details of a specific Jira issue',
    async (params, { config, uri }) => {
      let normalizedIssueKey = '';
      try {
        if (!params || !params.issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        normalizedIssueKey = Array.isArray(params.issueKey) ? params.issueKey[0] : params.issueKey;
        logger.info(`Getting details for Jira issue: ${normalizedIssueKey}`);
        const issue = await getIssue(config, normalizedIssueKey);
        // Format issue data
        const formattedIssue = formatIssueData(issue, config.baseUrl);
        // Chuẩn hóa metadata/schema
        return createStandardResource(
          uri,
          [formattedIssue],
          'issue',
          issueSchema,
          1,
          1,
          0,
          `${config.baseUrl}/browse/${normalizedIssueKey}`
        );
      } catch (error) {
        logger.error(`Error getting Jira issue ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: Issue transitions
  registerResource(
    server,
    'jira-issue-transitions',
    new ResourceTemplate('jira://issues/{issueKey}/transitions', { list: undefined }),
    'Available transitions for a Jira issue',
    async (params, { config, uri }) => {
      let normalizedIssueKey = '';
      try {
        if (!params || !params.issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        normalizedIssueKey = Array.isArray(params.issueKey) ? params.issueKey[0] : params.issueKey;
        logger.info(`Getting transitions for Jira issue: ${normalizedIssueKey}`);
        const transitions = await getIssueTransitions(config, normalizedIssueKey);
        // Chuẩn hóa metadata/schema
        return createStandardResource(
          uri,
          transitions,
          'transitions',
          transitionsListSchema,
          transitions.length,
          transitions.length,
          0,
          `${config.baseUrl}/browse/${normalizedIssueKey}`
        );
      } catch (error) {
        logger.error(`Error getting Jira issue transitions ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: Issue comments
  registerResource(
    server,
    'jira-issue-comments',
    new ResourceTemplate('jira://issues/{issueKey}/comments', { list: undefined }),
    'Comments on a Jira issue with pagination',
    async (params, { config, uri }) => {
      let normalizedIssueKey = '';
      try {
        if (!params || !params.issueKey) {
          throw new Error('Missing issueKey in URI');
        }
        // Extract pagination parameters
        const { limit, offset } = extractPagingParams(params);
        normalizedIssueKey = Array.isArray(params.issueKey) ? params.issueKey[0] : params.issueKey;
        logger.info(`Getting comments for Jira issue ${normalizedIssueKey} with limit=${limit}, offset=${offset}`);
        const commentsData = await getIssueComments(config, normalizedIssueKey, offset, limit);
        // Format comments to standardized format
        const formattedComments = (commentsData.comments || []).map(formatCommentData);
        // Calculate total count
        const totalCount = commentsData.total || 0;
        // UI URL for issue comments
        const uiUrl = `${config.baseUrl}/browse/${normalizedIssueKey}?focusedCommentId=`;
        // Chuẩn hóa metadata/schema
        return createStandardResource(
          uri,
          formattedComments,
          'comments',
          commentsListSchema,
          totalCount,
          limit,
          offset,
          uiUrl
        );
      } catch (error) {
        logger.error(`Error getting Jira issue comments ${normalizedIssueKey}:`, error);
        throw error;
      }
    }
  );
}
