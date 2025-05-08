/**
 * Jira Sprint Resources
 * 
 * These resources provide access to Jira sprints through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { sprintListSchema, sprintSchema, issuesListSchema } from '../../schemas/jira.js';
import { createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';
import { getSprintsByBoard, getSprintById, getSprintIssues } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';

const logger = Logger.getLogger('JiraSprintResources');

/**
 * Register all Jira sprint resources with MCP Server
 * @param server MCP Server instance
 */
export function registerSprintResources(server: McpServer) {
  logger.info('Registering Jira sprint resources...');

  // Resource: Board sprints
  registerResource(
    server,
    'jira-board-sprints',
    new ResourceTemplate('jira://boards/{boardId}/sprints', { list: undefined }),
    'List all sprints in a Jira board',
    async (params, { config, uri }) => {
      try {
        const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getSprintsByBoard(config, boardId, offset, limit);
        return createStandardResource(
          uri,
          response.values,
          'sprints',
          sprintListSchema,
          response.total || response.values.length,
          limit,
          offset,
          `${config.baseUrl}/jira/software/projects/browse/boards/${boardId}`
        );
      } catch (error) {
        logger.error(`Error getting sprints for board ${params.boardId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Sprint details
  registerResource(
    server,
    'jira-sprint-details',
    new ResourceTemplate('jira://sprints/{sprintId}', { list: undefined }),
    'Get details of a specific Jira sprint',
    async (params, { config, uri }) => {
      try {
        const sprintId = Array.isArray(params.sprintId) ? params.sprintId[0] : params.sprintId;
        const sprint = await getSprintById(config, sprintId);
        return createStandardResource(
          uri,
          [sprint],
          'sprint',
          sprintSchema,
          1,
          1,
          0,
          `${config.baseUrl}/jira/software/projects/browse/boards/${sprint.originBoardId}/sprint/${sprintId}`
        );
      } catch (error) {
        logger.error(`Error getting sprint details for sprint ${params.sprintId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Sprint issues
  registerResource(
    server,
    'jira-sprint-issues',
    new ResourceTemplate('jira://sprints/{sprintId}/issues', { list: undefined }),
    'List issues in a Jira sprint',
    async (params, { config, uri }) => {
      try {
        const sprintId = Array.isArray(params.sprintId) ? params.sprintId[0] : params.sprintId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getSprintIssues(config, sprintId, offset, limit);
        return createStandardResource(
          uri,
          response.issues,
          'issues',
          issuesListSchema,
          response.total || response.issues.length,
          limit,
          offset,
          `${config.baseUrl}/jira/software/projects/browse/issues/sprint/${sprintId}`
        );
      } catch (error) {
        logger.error(`Error getting issues for sprint ${params.sprintId}:`, error);
        throw error;
      }
    }
  );
  
  logger.info('Jira sprint resources registered successfully');
} 