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
    let response: Response;
    
    if (params.boardId) {
      // Get sprints from specific board
      url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}/sprint`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      response = await fetch(url, { 
        method: 'GET',
        headers, 
        credentials: 'omit' 
      });
    } else {
      // Try to get all sprints across all boards
      url = `${baseUrl}/rest/agile/1.0/sprint`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
      
      response = await fetch(url, { 
        method: 'GET',
        headers, 
        credentials: 'omit' 
      });
      
      // If global sprint endpoint fails (405 Method Not Allowed), try board-based approach
      if (!response.ok && response.status === 405) {
        logger.info('Global sprint endpoint not available, trying board-based approach...');
        
        try {
          // Get available boards first
          const boardsResponse = await fetch(`${baseUrl}/rest/agile/1.0/board?maxResults=50`, {
            method: 'GET',
            headers,
            credentials: 'omit'
          });
          
          if (boardsResponse.ok) {
            const boardsData = await boardsResponse.json();
            const allSprints: any[] = [];
            
            // Get sprints from each board
            for (const board of boardsData.values || []) {
              try {
                const boardSprintsUrl = `${baseUrl}/rest/agile/1.0/board/${board.id}/sprint`;
                const sprintParams = new URLSearchParams();
                if (params.maxResults !== undefined) sprintParams.append('maxResults', '50'); // Get more per board
                if (params.state) sprintParams.append('state', params.state);
                
                const boardSprintsResponse = await fetch(
                  boardSprintsUrl + (sprintParams.toString() ? `?${sprintParams.toString()}` : ''),
                  { method: 'GET', headers, credentials: 'omit' }
                );
                
                if (boardSprintsResponse.ok) {
                  const boardSprintsData = await boardSprintsResponse.json();
                  allSprints.push(...(boardSprintsData.values || []));
                }
              } catch (error) {
                // Continue with other boards if one fails
                logger.warn(`Failed to get sprints from board ${board.id}:`, error);
              }
            }
            
            // Create a mock response with aggregated data
            const aggregatedData = {
              values: allSprints.slice(params.startAt || 0, (params.startAt || 0) + (params.maxResults || 50)),
              startAt: params.startAt || 0,
              maxResults: params.maxResults || 50,
              total: allSprints.length,
              isLast: ((params.startAt || 0) + (params.maxResults || 50)) >= allSprints.length
            };
            
            // Use aggregated data for processing
            response = { ok: true, json: async () => aggregatedData } as any;
          }
        } catch (fallbackError) {
          logger.error('Fallback board-based approach also failed:', fallbackError);
        }
      }
    }

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