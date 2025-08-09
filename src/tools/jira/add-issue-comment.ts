import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:addIssueComment');

// Input parameter schema
export const addIssueCommentSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  body: z.string().describe('Comment text content'),
  visibility: z.object({
    type: z.enum(['group', 'role']).describe('Visibility type'),
    value: z.string().describe('Group name or role name')
  }).optional().describe('Comment visibility restriction'),
  jsdPublic: z.boolean().optional().describe('Whether comment is public in Jira Service Desk'),
  properties: z.array(z.object({
    key: z.string(),
    value: z.any()
  })).optional().describe('Comment properties')
});

type AddIssueCommentParams = z.infer<typeof addIssueCommentSchema>;

async function addIssueCommentImpl(params: AddIssueCommentParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Adding comment to issue: ${params.issueKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build comment payload with ADF format for API v3
    const commentPayload: any = {
      body: {
        type: "doc",
        version: 1,
        content: [
          {
            type: "paragraph",
            content: [
              {
                type: "text",
                text: params.body
              }
            ]
          }
        ]
      }
    };

    // Add optional fields
    if (params.visibility) {
      commentPayload.visibility = params.visibility;
    }
    if (params.jsdPublic !== undefined) {
      commentPayload.jsdPublic = params.jsdPublic;
    }
    if (params.properties && params.properties.length > 0) {
      commentPayload.properties = params.properties.reduce((acc, prop) => {
        acc[prop.key] = { value: prop.value };
        return acc;
      }, {} as Record<string, any>);
    }

    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}/comment`;

    const response = await fetch(url, {
      method: 'POST',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentPayload),
      credentials: 'omit'
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (add issue comment, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const newComment = await response.json();

    // Format response
    const formattedComment = {
      id: newComment.id,
      self: newComment.self,
      author: newComment.author ? {
        accountId: newComment.author.accountId,
        displayName: newComment.author.displayName,
        emailAddress: newComment.author.emailAddress,
        avatarUrls: newComment.author.avatarUrls
      } : null,
      body: newComment.body,
      created: newComment.created,
      updated: newComment.updated,
      visibility: newComment.visibility,
      jsdPublic: newComment.jsdPublic,
      properties: newComment.properties
    };

    return {
      issueKey: params.issueKey,
      comment: formattedComment,
      message: `Comment added successfully to issue ${params.issueKey}`,
      success: true
    };

  } catch (error) {
    logger.error('Error adding issue comment:', error);
    throw error;
  }
}

export const registerAddIssueCommentTool = (server: McpServer) => {
  server.tool(
    'addIssueComment',
    'Add a new comment to a specific Jira issue',
    addIssueCommentSchema.shape,
    async (params: AddIssueCommentParams, context: Record<string, any>) => {
      try {
        const result = await addIssueCommentImpl(params, context);
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