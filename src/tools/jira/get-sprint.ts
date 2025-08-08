import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getSprint');

// Input parameter schema
export const getSprintSchema = z.object({
  sprintId: z.union([z.string(), z.number()]).describe('Sprint ID')
});

type GetSprintParams = z.infer<typeof getSprintSchema>;

async function getSprintImpl(params: GetSprintParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting sprint details for ID: ${params.sprintId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Use Agile API v1.0 for sprint details
    const url = `${baseUrl}/rest/agile/1.0/sprint/${encodeURIComponent(params.sprintId.toString())}`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get sprint, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const sprint = await response.json();
    
    // Format sprint information
    const formattedSprint = {
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
      // Sprint goal
      goal: sprint.goal,
      // Sprint board information
      board: sprint.board ? {
        id: sprint.board.id,
        self: sprint.board.self,
        name: sprint.board.name,
        type: sprint.board.type,
        location: sprint.board.location ? {
          projectId: sprint.board.location.projectId,
          displayName: sprint.board.location.displayName,
          projectName: sprint.board.location.projectName,
          projectKey: sprint.board.location.projectKey,
          projectTypeKey: sprint.board.location.projectTypeKey,
          avatarURI: sprint.board.location.avatarURI,
          name: sprint.board.location.name
        } : null
      } : null,
      // Sprint capacity and velocity metrics
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
      } : null,
      // Sprint duration calculations
      duration: {
        totalDays: sprint.startDate && sprint.endDate ? 
          Math.ceil((new Date(sprint.endDate).getTime() - new Date(sprint.startDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
        activeDays: sprint.activatedDate && sprint.completeDate ? 
          Math.ceil((new Date(sprint.completeDate).getTime() - new Date(sprint.activatedDate).getTime()) / (1000 * 60 * 60 * 24)) : null,
        remainingDays: sprint.state === 'active' && sprint.endDate ? 
          Math.ceil((new Date(sprint.endDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24)) : null
      }
    };

    return {
      sprint: formattedSprint,
      success: true
    };

  } catch (error) {
    logger.error('Error getting sprint details:', error);
    throw error;
  }
}

export const registerGetSprintTool = (server: McpServer) => {
  server.tool(
    'getSprint',
    'Get detailed information about a specific Jira sprint including metrics and board details',
    getSprintSchema.shape,
    async (params: GetSprintParams, context: Record<string, any>) => {
      try {
        const result = await getSprintImpl(params, context);
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