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

const logger = Logger.getLogger('ConfluenceContentMetadataResources');

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
 * Register all Confluence content metadata resources with MCP Server
 * @param server MCP Server instance
 */
export function registerContentMetadataResources(server: McpServer) {
  logger.info('Registering Confluence content metadata resources...');

  // Resource: Page labels
  server.resource(
    'confluence-page-labels',
    new ResourceTemplate('confluence://pages/{pageId}/labels', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/labels',
            name: 'Confluence Page Labels',
            description: 'List all labels for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      // Get config from environment
      const config = getAtlassianConfigFromEnv();
      let normalizedPageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
      
      if (!normalizedPageId) throw new Error('Missing pageId in URI');
      
      logger.info(`Getting labels for Confluence page (v2): ${normalizedPageId}`);
      
      const data = await getPageLabelsV2(config, normalizedPageId);
      const formattedLabels = (data.results || []).map((label: any) => ({
        id: label.id,
        name: label.name,
        prefix: label.prefix
      }));
      
      const uriString = typeof uri === 'string' ? uri : uri.href;
      
      return {
        contents: [{
          uri: uriString,
          mimeType: 'application/json',
          text: JSON.stringify({
            labels: formattedLabels,
            total: data.size || formattedLabels.length,
            message: `Found ${formattedLabels.length} label(s) for page ${normalizedPageId}`
          })
        }]
      };
    }
  );

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