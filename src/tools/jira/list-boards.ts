import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listBoards');

// Input parameter schema
export const listBoardsSchema = z.object({
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of boards to return (default: 50, max: 100)'),
  type: z.enum(['scrum', 'kanban', 'simple']).optional().describe('Filter boards by type'),
  name: z.string().optional().describe('Filter boards by name (partial match)'),
  projectKeyOrId: z.string().optional().describe('Filter boards by project key or ID'),
  accountIdLocation: z.string().optional().describe('Filter boards by user account ID'),
  userkeyLocation: z.string().optional().describe('Filter boards by user key (deprecated)'),
  usernameLocation: z.string().optional().describe('Filter boards by username (deprecated)'),
  projectLocation: z.string().optional().describe('Filter boards by project location'),
  includePrivate: z.boolean().optional().describe('Include private boards (default: false)'),
  negateLocationFiltering: z.boolean().optional().describe('Negate location filtering (default: false)'),
  orderBy: z.enum(['name', '-name', 'favourite', '-favourite']).optional().describe('Sort order (default: name)'),
  expand: z.string().optional().describe('Expand options (e.g., "admins,permissions")')
});

type ListBoardsParams = z.infer<typeof listBoardsSchema>;

async function listBoardsImpl(params: ListBoardsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Listing Jira boards with filters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.type) queryParams.append('type', params.type);
    if (params.name) queryParams.append('name', params.name);
    if (params.projectKeyOrId) queryParams.append('projectKeyOrId', params.projectKeyOrId);
    if (params.accountIdLocation) queryParams.append('accountIdLocation', params.accountIdLocation);
    if (params.userkeyLocation) queryParams.append('userkeyLocation', params.userkeyLocation);
    if (params.usernameLocation) queryParams.append('usernameLocation', params.usernameLocation);
    if (params.projectLocation) queryParams.append('projectLocation', params.projectLocation);
    if (params.includePrivate !== undefined) queryParams.append('includePrivate', params.includePrivate.toString());
    if (params.negateLocationFiltering !== undefined) queryParams.append('negateLocationFiltering', params.negateLocationFiltering.toString());
    if (params.orderBy) queryParams.append('orderBy', params.orderBy);
    if (params.expand) queryParams.append('expand', params.expand);

    // Use Agile API v1.0 for boards
    let url = `${baseUrl}/rest/agile/1.0/board`;
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
      logger.error(`Jira Agile API error (list boards, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format boards information
    const boards = data.values?.map((board: any) => ({
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
      // Include expanded fields if requested
      admins: board.admins,
      permissions: board.permissions
    })) || [];

    return {
      boards,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50,
        total: data.total || boards.length,
        isLast: data.isLast !== undefined ? data.isLast : (data.startAt + data.maxResults >= data.total)
      },
      totalBoards: data.total || boards.length,
      filters: params,
      success: true
    };

  } catch (error) {
    logger.error('Error listing boards:', error);
    throw error;
  }
}

export const registerListBoardsTool = (server: McpServer) => {
  server.tool(
    'listBoards',
    'List all accessible Jira boards with optional filtering and pagination',
    listBoardsSchema.shape,
    async (params: ListBoardsParams, context: Record<string, any>) => {
      try {
        const result = await listBoardsImpl(params, context);
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