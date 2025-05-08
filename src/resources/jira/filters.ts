/**
 * Jira Filter Resources
 * 
 * These resources provide access to Jira filters through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { filterListSchema, filterSchema } from '../../schemas/jira.js';
import { createStandardMetadata } from '../../schemas/common.js';
import { getFilters, getFilterById, getMyFilters } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('JiraFilterResources');

/**
 * Register all Jira filter resources with MCP Server
 * @param server MCP Server instance
 */
export function registerFilterResources(server: McpServer) {
  logger.info('Registering Jira filter resources...');
  
  // Resource: Filter list
  registerResource(
    server,
    'jira-filters',
    new ResourceTemplate('jira://filters', { list: undefined }),
    'List all Jira filters',
    async (params, { config, uri }) => {
      try {
        const { limit, offset } = extractPagingParams(params);
        const response = await getFilters(config, offset, limit);
        return createStandardResource(
          uri,
          response.values,
          'filters',
          filterListSchema,
          response.total || response.values.length,
          limit,
          offset,
          `${config.baseUrl}/secure/ManageFilters.jspa`
        );
      } catch (error) {
        logger.error('Error getting filter list:', error);
        throw error;
      }
    }
  );

  // Resource: Filter details
  registerResource(
    server,
    'jira-filter-details',
    new ResourceTemplate('jira://filters/{filterId}', { list: undefined }),
    'Get details of a specific Jira filter',
    async (params, { config, uri }) => {
      try {
        const filterId = Array.isArray(params.filterId) ? params.filterId[0] : params.filterId;
        
        // Get filter details
        const filter = await getFilterById(config, filterId);
        
        // Format and return data
        return createStandardResource(
          uri,
          [filter],
          'filter',
          filterSchema,
          1,
          1,
          0,
          `${config.baseUrl}/secure/ManageFilters.jspa?filterId=${filterId}`
        );
      } catch (error) {
        logger.error(`Error getting filter details for filter ${params.filterId}:`, error);
        throw error;
      }
    }
  );

  // Resource: My filters
  registerResource(
    server,
    'jira-my-filters',
    new ResourceTemplate('jira://filters/my', { list: undefined }),
    'List filters owned by or shared with the current user',
    async (params, { config, uri }) => {
      try {
        // Get my filters
        const filters = await getMyFilters(config);
        
        // Format and return data
        return createStandardResource(
          uri,
          filters,
          'filters',
          filterListSchema,
          filters.length,
          filters.length,
          0,
          `${config.baseUrl}/secure/ManageFilters.jspa?filterView=my`
        );
      } catch (error) {
        logger.error('Error getting my filters:', error);
        throw error;
      }
    }
  );
  
  logger.info('Jira filter resources registered successfully');
} 