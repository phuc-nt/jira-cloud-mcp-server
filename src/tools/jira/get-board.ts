import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getBoard');

// Input parameter schema
export const getBoardSchema = z.object({
  boardId: z.union([z.string(), z.number()]).describe('Board ID'),
  expand: z.string().optional().describe('Expand options (e.g., "admins,permissions")')
});

type GetBoardParams = z.infer<typeof getBoardSchema>;

async function getBoardImpl(params: GetBoardParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting board details for ID: ${params.boardId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL with optional expand parameter
    let url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}`;
    if (params.expand) {
      url += `?expand=${encodeURIComponent(params.expand)}`;
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get board, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const board = await response.json();
    
    // Format board information
    const formattedBoard = {
      id: board.id,
      self: board.self,
      name: board.name,
      type: board.type,
      location: board.location ? {
        projectId: board.location.projectId,
        displayName: board.location.displayName,
        projectName: board.location.projectName,
        projectKey: board.location.projectKey,
        projectTypeKey: board.location.projectTypeKey,
        avatarURI: board.location.avatarURI,
        name: board.location.name
      } : null,
      favourite: board.favourite,
      canEdit: board.canEdit,
      isPrivate: board.isPrivate,
      // Include expanded fields if requested
      admins: board.admins ? board.admins.map((admin: any) => ({
        accountId: admin.accountId,
        displayName: admin.displayName,
        emailAddress: admin.emailAddress,
        avatarUrls: admin.avatarUrls,
        active: admin.active
      })) : undefined,
      permissions: board.permissions ? {
        canEdit: board.permissions.canEdit,
        canView: board.permissions.canView,
        canEditConfiguration: board.permissions.canEditConfiguration
      } : undefined,
      // Additional board details
      columnConfig: board.columnConfig ? {
        columns: board.columnConfig.columns?.map((column: any) => ({
          name: column.name,
          statuses: column.statuses?.map((status: any) => ({
            id: status.id,
            self: status.self,
            name: status.name,
            description: status.description,
            category: status.statusCategory
          }))
        }))
      } : undefined,
      subQuery: board.subQuery ? {
        query: board.subQuery.query
      } : undefined
    };

    return {
      board: formattedBoard,
      success: true
    };

  } catch (error) {
    logger.error('Error getting board details:', error);
    throw error;
  }
}

export const registerGetBoardTool = (server: McpServer) => {
  server.tool(
    'getBoard',
    'Get detailed information about a specific Jira board',
    getBoardSchema.shape,
    async (params: GetBoardParams, context: Record<string, any>) => {
      try {
        const result = await getBoardImpl(params, context);
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