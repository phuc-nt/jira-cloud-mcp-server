/**
 * Jira Board Resources
 * 
 * These resources provide access to Jira boards through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { boardListSchema, boardSchema, issuesListSchema } from '../../schemas/jira.js';
import { getBoards, getBoardById, getBoardIssues } from '../../utils/jira-resource-api.js';
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
    new ResourceTemplate('jira://boards', {
      list: async (_extra) => {
        return {
          resources: [
            {
              uri: 'jira://boards',
              name: 'Jira Boards',
              description: 'List and search all Jira boards',
              mimeType: 'application/json'
            }
          ]
        };
      }
    }),
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
    new ResourceTemplate('jira://boards/{boardId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://boards/{boardId}',
            name: 'Jira Board Details',
            description: 'Get details for a specific Jira board by ID. Replace {boardId} with the board ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
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
    new ResourceTemplate('jira://boards/{boardId}/issues', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://boards/{boardId}/issues',
            name: 'Jira Board Issues',
            description: 'List issues in a Jira board. Replace {boardId} with the board ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
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

  // Resource: Board configuration
  registerResource(
    server,
    'jira-board-configuration',
    new ResourceTemplate('jira://boards/{boardId}/configuration', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://boards/{boardId}/configuration',
            name: 'Jira Board Configuration',
            description: 'Get configuration of a specific Jira board. Replace {boardId} with the board ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'Get configuration of a specific Jira board',
    async (params, { config, uri }) => {
      try {
        const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;
        // Gọi API lấy cấu hình board
        const response = await fetch(`${config.baseUrl}/rest/agile/1.0/board/${boardId}/configuration`, {
          method: 'GET',
          headers: {
            'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`,
            'Accept': 'application/json',
            'Content-Type': 'application/json',
          },
        });
        if (!response.ok) throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
        const configData = await response.json();
        // Inline schema (mô tả cơ bản, không validate sâu)
        const boardConfigurationSchema = {
          type: 'object',
          properties: {
            id: { type: 'number' },
            name: { type: 'string' },
            type: { type: 'string' },
            self: { type: 'string' },
            location: { type: 'object' },
            filter: { type: 'object' },
            subQuery: { type: 'object' },
            columnConfig: { type: 'object' },
            estimation: { type: 'object' },
            ranking: { type: 'object' }
          },
          required: ['id', 'name', 'type', 'self', 'columnConfig']
        };
        return {
          contents: [{
            uri: uri,
            mimeType: 'application/json',
            text: JSON.stringify(configData),
            schema: boardConfigurationSchema
          }]
        };
      } catch (error) {
        logger.error(`Error getting board configuration for board ${params.boardId}:`, error);
        throw error;
      }
    }
  );
  
  logger.info('Jira board resources registered successfully');
}