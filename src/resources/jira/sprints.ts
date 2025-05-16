/**
 * Jira Sprint Resources
 * 
 * These resources provide access to Jira sprints through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { sprintListSchema, sprintSchema, issuesListSchema } from '../../schemas/jira.js';
import { createStandardResource, extractPagingParams } from '../../utils/mcp-resource.js';
import { getSprintsByBoard, getSprintById, getSprintIssues } from '../../utils/jira-resource-api.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';

const logger = Logger.getLogger('JiraSprintResources');

/**
 * Get Atlassian config from environment variables
 */
function getAtlassianConfigFromEnv(): AtlassianConfig {
  const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
  const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

  if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
    throw new Error('Missing Atlassian credentials in environment variables');
  }

  return {
    baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
      ? `https://${ATLASSIAN_SITE_NAME}` 
      : ATLASSIAN_SITE_NAME,
    email: ATLASSIAN_USER_EMAIL,
    apiToken: ATLASSIAN_API_TOKEN
  };
}

/**
 * Register all Jira sprint resources with MCP Server
 * @param server MCP Server instance
 */
export function registerSprintResources(server: McpServer) {
  logger.info('Registering Jira sprint resources...');

  // Resource: Board sprints
  server.resource(
    'jira-board-sprints',
    new ResourceTemplate('jira://boards/{boardId}/sprints', { 
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://boards/{boardId}/sprints',
            name: 'Jira Board Sprints',
            description: 'List all sprints in a Jira board. Replace {boardId} with the board ID.',
            mimeType: 'application/json'
          }
        ]
      }) 
    }),
    async (uri, params, _extra) => {
      try {
        const config = getAtlassianConfigFromEnv();
        const boardId = Array.isArray(params.boardId) ? params.boardId[0] : params.boardId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getSprintsByBoard(config, boardId, offset, limit);
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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
  server.resource(
    'jira-sprint-details',
    new ResourceTemplate('jira://sprints/{sprintId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://sprints/{sprintId}',
            name: 'Jira Sprint Details',
            description: 'Get details for a specific Jira sprint by ID. Replace {sprintId} with the sprint ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      try {
        const config = getAtlassianConfigFromEnv();
        const sprintId = Array.isArray(params.sprintId) ? params.sprintId[0] : params.sprintId;
        const sprint = await getSprintById(config, sprintId);
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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
  server.resource(
    'jira-sprint-issues',
    new ResourceTemplate('jira://sprints/{sprintId}/issues', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://sprints/{sprintId}/issues',
            name: 'Jira Sprint Issues',
            description: 'List issues in a Jira sprint. Replace {sprintId} with the sprint ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      try {
        const config = getAtlassianConfigFromEnv();
        const sprintId = Array.isArray(params.sprintId) ? params.sprintId[0] : params.sprintId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getSprintIssues(config, sprintId, offset, limit);
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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
  
  // Resource: All sprints
  server.resource(
    'jira-sprints',
    new ResourceTemplate('jira://sprints', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://sprints',
            name: 'Jira Sprints',
            description: 'List and search all Jira sprints',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, _params, _extra) => {
      const uriString = typeof uri === 'string' ? uri : uri.href;
      return {
        contents: [{
          uri: uriString,
          mimeType: 'application/json',
          text: JSON.stringify({
            message: "Please use specific board sprints URI: jira://boards/{boardId}/sprints",
            suggestion: "To view sprints, first select a board using jira://boards, then access the board's sprints with jira://boards/{boardId}/sprints"
          })
        }]
      };
    }
  );

  logger.info('Jira sprint resources registered successfully');
}