import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateIssueComment');

// Input parameter schema
export const updateIssueCommentSchema = z.object({
  issueKey: z.string().describe('Issue key (e.g., PROJ-123)'),
  commentId: z.string().describe('Comment ID to update'),
  body: z.string().describe('Updated comment text content'),
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

type UpdateIssueCommentParams = z.infer<typeof updateIssueCommentSchema>;

async function updateIssueCommentImpl(params: UpdateIssueCommentParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Updating comment ${params.commentId} on issue: ${params.issueKey}`);

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

    const url = `${baseUrl}/rest/api/3/issue/${encodeURIComponent(params.issueKey)}/comment/${encodeURIComponent(params.commentId)}`;

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        ...headers,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(commentPayload),
      credentials: 'omit'
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (update issue comment, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const updatedComment = await response.json();

    // Format response
    const formattedComment = {
      id: updatedComment.id,
      self: updatedComment.self,
      author: updatedComment.author ? {
        accountId: updatedComment.author.accountId,
        displayName: updatedComment.author.displayName,
        emailAddress: updatedComment.author.emailAddress,
        avatarUrls: updatedComment.author.avatarUrls
      } : null,
      updateAuthor: updatedComment.updateAuthor ? {
        accountId: updatedComment.updateAuthor.accountId,
        displayName: updatedComment.updateAuthor.displayName,
        emailAddress: updatedComment.updateAuthor.emailAddress
      } : null,
      body: updatedComment.body,
      created: updatedComment.created,
      updated: updatedComment.updated,
      visibility: updatedComment.visibility,
      jsdPublic: updatedComment.jsdPublic,
      properties: updatedComment.properties
    };

    return {
      issueKey: params.issueKey,
      comment: formattedComment,
      message: `Comment ${params.commentId} updated successfully on issue ${params.issueKey}`,
      success: true
    };

  } catch (error) {
    logger.error('Error updating issue comment:', error);
    throw error;
  }
}

export const registerUpdateIssueCommentTool = (server: McpServer) => {
  server.tool(
    'updateIssueComment',
    'Update an existing comment on a specific Jira issue',
    updateIssueCommentSchema.shape,
    async (params: UpdateIssueCommentParams, context: Record<string, any>) => {
      try {
        const result = await updateIssueCommentImpl(params, context);
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