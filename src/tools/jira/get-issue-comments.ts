import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getIssueComments');

// Input parameter schema
export const getIssueCommentsSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  startAt: z.number().optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().max(100).optional().describe('Maximum number of comments to return (default: 50, max: 100)'),
  orderBy: z.enum(['created', '-created', 'updated', '-updated']).optional().describe('Sort order (default: created)'),
  expand: z.string().optional().describe('Expand options for comments (e.g., "renderedBody,properties")')
});

type GetIssueCommentsParams = z.infer<typeof getIssueCommentsSchema>;

async function getIssueCommentsImpl(params: GetIssueCommentsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting comments for issue: ${params.issueKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.expand) queryParams.append('expand', params.expand);

    let url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}/comment`;
    if (queryParams.toString()) {
      url += `?${queryParams.toString()}`;
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get issue comments, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format comments information
    const comments = data.comments?.map((comment: any) => ({
      id: comment.id,
      self: comment.self,
      author: comment.author ? {
        accountId: comment.author.accountId,
        displayName: comment.author.displayName,
        emailAddress: comment.author.emailAddress,
        avatarUrls: comment.author.avatarUrls
      } : null,
      body: comment.body,
      renderedBody: comment.renderedBody,
      updateAuthor: comment.updateAuthor ? {
        accountId: comment.updateAuthor.accountId,
        displayName: comment.updateAuthor.displayName,
        emailAddress: comment.updateAuthor.emailAddress
      } : null,
      created: comment.created,
      updated: comment.updated,
      visibility: comment.visibility ? {
        type: comment.visibility.type,
        value: comment.visibility.value
      } : null,
      jsdPublic: comment.jsdPublic,
      jsdAuthorCanSeeRequest: comment.jsdAuthorCanSeeRequest,
      properties: comment.properties
    })) || [];

    return {
      issueKey: params.issueKey,
      comments,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50,
        total: data.total || comments.length,
        isLast: data.startAt + data.maxResults >= data.total
      },
      totalComments: data.total || comments.length,
      success: true
    };

  } catch (error) {
    logger.error('Error getting issue comments:', error);
    throw error;
  }
}

export const registerGetIssueCommentsTool = (server: McpServer) => {
  server.tool(
    'getIssueComments',
    'Get comments for a specific Jira issue with pagination support',
    getIssueCommentsSchema.shape,
    async (params: GetIssueCommentsParams, context: Record<string, any>) => {
      try {
        const result = await getIssueCommentsImpl(params, context);
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
                error: error instanceof Error ? error.message : String(error) 
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};