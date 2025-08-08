import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getBoardConfiguration');

// Input parameter schema
export const getBoardConfigurationSchema = z.object({
  boardId: z.union([z.string(), z.number()]).describe('Board ID')
});

type GetBoardConfigurationParams = z.infer<typeof getBoardConfigurationSchema>;

async function getBoardConfigurationImpl(params: GetBoardConfigurationParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting configuration for board ID: ${params.boardId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Use Agile API v1.0 for board configuration
    const url = `${baseUrl}/rest/agile/1.0/board/${encodeURIComponent(params.boardId.toString())}/configuration`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get board configuration, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const boardConfig = await response.json();
    
    // Format board configuration information
    const formattedConfig = {
      id: boardConfig.id,
      name: boardConfig.name,
      self: boardConfig.self,
      // Board type and location
      type: boardConfig.type,
      location: boardConfig.location ? {
        type: boardConfig.location.type,
        key: boardConfig.location.key,
        id: boardConfig.location.id,
        self: boardConfig.location.self,
        name: boardConfig.location.name,
        avatarURI: boardConfig.location.avatarURI,
        displayName: boardConfig.location.displayName,
        projectName: boardConfig.location.projectName,
        projectKey: boardConfig.location.projectKey,
        projectId: boardConfig.location.projectId,
        projectTypeKey: boardConfig.location.projectTypeKey
      } : null,
      // Column configuration
      columnConfig: boardConfig.columnConfig ? {
        columns: boardConfig.columnConfig.columns?.map((column: any) => ({
          name: column.name,
          min: column.min,
          max: column.max,
          statuses: column.statuses?.map((status: any) => ({
            id: status.id,
            self: status.self,
            name: status.name,
            description: status.description,
            iconUrl: status.iconUrl,
            statusCategory: {
              id: status.statusCategory?.id,
              key: status.statusCategory?.key,
              colorName: status.statusCategory?.colorName,
              name: status.statusCategory?.name,
              self: status.statusCategory?.self
            }
          })) || []
        })) || [],
        constraintType: boardConfig.columnConfig.constraintType
      } : null,
      // Estimation configuration
      estimation: boardConfig.estimation ? {
        type: boardConfig.estimation.type,
        field: boardConfig.estimation.field ? {
          fieldId: boardConfig.estimation.field.fieldId,
          displayName: boardConfig.estimation.field.displayName
        } : null
      } : null,
      // Ranking configuration
      ranking: boardConfig.ranking ? {
        rankCustomFieldId: boardConfig.ranking.rankCustomFieldId
      } : null,
      // Filter configuration
      filter: boardConfig.filter ? {
        id: boardConfig.filter.id,
        self: boardConfig.filter.self,
        name: boardConfig.filter.name,
        description: boardConfig.filter.description,
        owner: boardConfig.filter.owner ? {
          key: boardConfig.filter.owner.key,
          accountId: boardConfig.filter.owner.accountId,
          displayName: boardConfig.filter.owner.displayName,
          emailAddress: boardConfig.filter.owner.emailAddress
        } : null,
        jql: boardConfig.filter.jql,
        viewUrl: boardConfig.filter.viewUrl,
        searchUrl: boardConfig.filter.searchUrl,
        favourite: boardConfig.filter.favourite,
        favouritedCount: boardConfig.filter.favouritedCount,
        sharePermissions: boardConfig.filter.sharePermissions,
        editPermissions: boardConfig.filter.editPermissions,
        subscriptions: boardConfig.filter.subscriptions
      } : null,
      // Sub query configuration
      subQuery: boardConfig.subQuery ? {
        query: boardConfig.subQuery.query
      } : null,
      // Card layout configuration
      cardLayout: boardConfig.cardLayout ? {
        showAssignee: boardConfig.cardLayout.showAssignee,
        showAvatar: boardConfig.cardLayout.showAvatar,
        showDueDate: boardConfig.cardLayout.showDueDate,
        showEpic: boardConfig.cardLayout.showEpic,
        showFixVersion: boardConfig.cardLayout.showFixVersion,
        showLabels: boardConfig.cardLayout.showLabels,
        showParent: boardConfig.cardLayout.showParent,
        showPriority: boardConfig.cardLayout.showPriority,
        showSubtasks: boardConfig.cardLayout.showSubtasks
      } : null
    };

    return {
      boardId: params.boardId,
      configuration: formattedConfig,
      success: true
    };

  } catch (error) {
    logger.error('Error getting board configuration:', error);
    throw error;
  }
}

export const registerGetBoardConfigurationTool = (server: McpServer) => {
  server.tool(
    'getBoardConfiguration',
    'Get configuration details of a specific Jira board',
    getBoardConfigurationSchema.shape,
    async (params: GetBoardConfigurationParams, context: Record<string, any>) => {
      try {
        const result = await getBoardConfigurationImpl(params, context);
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