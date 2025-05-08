/**
 * Confluence Content Metadata Resources (Labels, Attachments, Versions)
 * 
 * These resources provide access to metadata about Confluence pages through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { labelListSchema, attachmentListSchema, versionListSchema } from '../../schemas/confluence.js';
import { getPageLabels, getPageAttachments, getPageVersions } from '../../utils/atlassian-api.js';
import { Logger } from '../../utils/logger.js';
import { createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('ConfluenceContentMetadataResources');

/**
 * Register all Confluence content metadata resources with MCP Server
 * @param server MCP Server instance
 */
export function registerContentMetadataResources(server: McpServer) {
  logger.info('Registering Confluence content metadata resources...');

  // Resource: Page labels
  registerResource(
    server,
    'confluence-page-labels',
    new ResourceTemplate('confluence://pages/{pageId}/labels', { list: undefined }),
    'List all labels for a Confluence page',
    async (params, { config, uri }) => {
      try {
        const pageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getPageLabels(config, pageId, offset, limit);
        return createStandardResource(
          uri,
          response.results,
          'labels',
          labelListSchema,
          response.size || response.results.length,
          limit,
          offset,
          `${config.baseUrl}/pages/viewpage.action?pageId=${pageId}`
        );
      } catch (error) {
        logger.error(`Error getting labels for page ${params.pageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Page attachments
  registerResource(
    server,
    'confluence-page-attachments',
    new ResourceTemplate('confluence://pages/{pageId}/attachments', { list: undefined }),
    'List all attachments for a Confluence page',
    async (params, { config, uri }) => {
      try {
        const pageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getPageAttachments(config, pageId, offset, limit);
        const formattedAttachments = response.results.map((attachment: any) => {
          return {
            ...attachment,
            downloadUrl: `${config.baseUrl}${attachment._links.download}`
          };
        });
        return createStandardResource(
          uri,
          formattedAttachments,
          'attachments',
          attachmentListSchema,
          response.size || response.results.length,
          limit,
          offset,
          `${config.baseUrl}/pages/viewpage.action?pageId=${pageId}`
        );
      } catch (error) {
        logger.error(`Error getting attachments for page ${params.pageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Page versions
  registerResource(
    server,
    'confluence-page-versions',
    new ResourceTemplate('confluence://pages/{pageId}/versions', { list: undefined }),
    'List all versions of a Confluence page',
    async (params, { config, uri }) => {
      try {
        const pageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
        const { limit, offset } = extractPagingParams(params);
        const response = await getPageVersions(config, pageId, offset, limit);
        return createStandardResource(
          uri,
          response.results,
          'versions',
          versionListSchema,
          response.size || response.results.length,
          limit,
          offset,
          `${config.baseUrl}/pages/viewpage.action?pageId=${pageId}`
        );
      } catch (error) {
        logger.error(`Error getting versions for page ${params.pageId}:`, error);
        throw error;
      }
    }
  );
  
  logger.info('Confluence content metadata resources registered successfully');
} 