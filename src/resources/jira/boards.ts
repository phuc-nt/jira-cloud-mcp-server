/**
 * Jira Board Resources
 * 
 * These resources provide access to Jira boards through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { boardListSchema, boardSchema, issuesListSchema } from '../../schemas/jira.js';
import { getBoards, getBoardById, getBoardIssues } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraBoardResources');

/**
 * Register all Jira board resources with MCP Server
 * @param server MCP Server instance
 */
export function registerBoardResources(server: McpServer) {
  logger.info('Registering Jira board resources...');
  
  // Resource: Board list
  registerResource(
    server,
    'jira-boards',
    new ResourceTemplate('jira://boards', { list: undefined }),
    'List all Jira boards',
    async (params, { config, uri }) => {
      try {
        const { limit, offset } = extractPagingParams(params);
        const response = await getBoards(config, offset, limit);
        return createStandardResource(
          uri,
          response.values,
          'boards',
          boardListSchema,
          response.total || response.values.length,
          limit,
          offset,
          `${config.baseUrl}/jira/boards`
        );
      } catch (error) {
        logger.error('Error getting board list:', error);
        throw error;
      }
    }
  );

  // Resource: Board details
  registerResource(
    server,
    'jira-board-details',
    new ResourceTemplate('jira://boards/{boardId}', { list: undefined }),
    'Get details of a specific Jira board',
    async (params, { config, uri }) => {
      try {
        const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;
        const board = await getBoardById(config, boardId);
        return createStandardResource(
          uri,
          [board],
          'board',
          boardSchema,
          1,
          1,
          0,
          `${config.baseUrl}/jira/software/projects/${board.location?.projectKey || 'browse'}/boards/${boardId}`
        );
      } catch (error) {
        logger.error(`Error getting board details for board ${params.boardId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Issues in board
  registerResource(
    server,
    'jira-board-issues',
    new ResourceTemplate('jira://boards/{boardId}/issues', { list: undefined }),
    'List issues in a Jira board',
    async (params, { config, uri }) => {
      try {
        const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getBoardIssues(config, boardId, offset, limit);
        return createStandardResource(
          uri,
          response.issues,
          'issues',
          issuesListSchema,
          response.total || response.issues.length,
          limit,
          offset,
          `${config.baseUrl}/jira/software/projects/browse/boards/${boardId}`
        );
      } catch (error) {
        logger.error(`Error getting issues for board ${params.boardId}:`, error);
        throw error;
      }
    }
  );
  
  logger.info('Jira board resources registered successfully');
} 