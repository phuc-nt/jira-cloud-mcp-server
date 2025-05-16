/**
 * Confluence Content Metadata Resources (Labels, Attachments, Versions)
 * 
 * These resources provide access to metadata about Confluence pages through MCP.
 */

import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { labelListSchema, attachmentListSchema, versionListSchema } from '../../schemas/confluence.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { getConfluencePageLabelsV2, getConfluencePageAttachmentsV2, getConfluencePageVersionsV2 } from '../../utils/confluence-resource-api.js';
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
    new ResourceTemplate('confluence://pages/{pageId}/labels', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/labels',
            name: 'Confluence Page Labels',
            description: 'List all labels for a Confluence page. Replace {pageId} với ID trang.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'List all labels for a Confluence page',
    async (params, { config, uri }) => {
      // ...existing code for fetching labels...
    }
  );

  // ...KHÔNG đăng ký lại resource attachments/versions ở đây để tránh trùng lặp...

  logger.info('Confluence content metadata resources registered successfully');
}

/**
 * Helper function to get page labels from Confluence API v2 (cursor-based)
 */
async function getPageLabelsV2(config: AtlassianConfig, pageId: string, cursor: string | undefined = undefined, limit: number = 25): Promise<any> {
  return await getConfluencePageLabelsV2(config, pageId, cursor, limit);
}

/**
 * Helper function to get page attachments from Confluence API v2 (cursor-based)
 */
async function getPageAttachmentsV2(config: AtlassianConfig, pageId: string, cursor: string | undefined = undefined, limit: number = 25): Promise<any> {
  return await getConfluencePageAttachmentsV2(config, pageId, cursor, limit);
}

/**
 * Helper function to get page versions from Confluence API v2 (cursor-based)
 */
async function getPageVersionsV2(config: AtlassianConfig, pageId: string, cursor: string | undefined = undefined, limit: number = 25): Promise<any> {
  return await getConfluencePageVersionsV2(config, pageId, cursor, limit);
}