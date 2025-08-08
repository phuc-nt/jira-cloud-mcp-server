import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listSprints');

// Input parameter schema
export const listSprintsSchema = z.object({
  startAt: z.number().min(0).optional().describe('Starting index for pagination (default: 0)'),
  maxResults: z.number().min(1).max(100).optional().describe('Maximum number of sprints to return (default: 50, max: 100)'),
  state: z.enum(['active', 'closed', 'future']).optional().describe('Filter sprints by state'),
  boardId: z.union([z.string(), z.number()]).optional().describe('Filter sprints by board ID')
});

type ListSprintsParams = z.infer<typeof listSprintsSchema>;

async function listSprintsImpl(params: ListSprintsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Listing Jira sprints with filters:', params);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.startAt !== undefined) queryParams.append('startAt', params.startAt.toString());
    if (params.maxResults !== undefined) queryParams.append('maxResults', params.maxResults.toString());
    if (params.state) queryParams.append('state', params.state);

    // Use different endpoint based on whether boardId is specified
    let url: string;
    if (params.boardId) {
      // Get sprints from specific board
      url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}/sprint`;
    } else {
      // Get all sprints across all boards
      url = `${baseUrl}/rest/agile/1.0/sprint`;
    }

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
      logger.error(`Jira Agile API error (list sprints, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Format sprints information
    const sprints = data.values?.map((sprint: any) => ({
      id: sprint.id,
      self: sprint.self,
      name: sprint.name,
      state: sprint.state,
      startDate: sprint.startDate,
      endDate: sprint.endDate,
      completeDate: sprint.completeDate,
      activatedDate: sprint.activatedDate,
      originBoardId: sprint.originBoardId,
      createdDate: sprint.createdDate,
      // Sprint goal if available
      goal: sprint.goal,
      // Sprint board information
      board: sprint.board ? {
        id: sprint.board.id,
        name: sprint.board.name,
        type: sprint.board.type,
        location: sprint.board.location ? {
          projectKey: sprint.board.location.projectKey,
          projectName: sprint.board.location.projectName,
          projectId: sprint.board.location.projectId
        } : null
      } : null,
      // Sprint metrics if available
      capacity: sprint.capacity ? {
        commitment: sprint.capacity.commitment,
        issuesCount: sprint.capacity.issuesCount,
        issuesNotDoneCount: sprint.capacity.issuesNotDoneCount,
        issuesDoneCount: sprint.capacity.issuesDoneCount,
        incomplete: sprint.capacity.incomplete,
        punted: sprint.capacity.punted
      } : null,
      velocity: sprint.velocity ? {
        commitment: sprint.velocity.commitment,
        completed: sprint.velocity.completed
      } : null
    })) || [];

    return {
      sprints,
      pagination: {
        startAt: data.startAt || 0,
        maxResults: data.maxResults || 50,
        total: data.total || sprints.length,
        isLast: data.isLast !== undefined ? data.isLast : (data.startAt + data.maxResults >= data.total)
      },
      totalSprints: data.total || sprints.length,
      filters: {
        state: params.state,
        boardId: params.boardId
      },
      success: true
    };

  } catch (error) {
    logger.error('Error listing sprints:', error);
    throw error;
  }
}

export const registerListSprintsTool = (server: McpServer) => {
  server.tool(
    'listSprints',
    'List Jira sprints with optional filtering by state and board, with pagination support',
    listSprintsSchema.shape,
    async (params: ListSprintsParams, context: Record<string, any>) => {
      try {
        const result = await listSprintsImpl(params, context);
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