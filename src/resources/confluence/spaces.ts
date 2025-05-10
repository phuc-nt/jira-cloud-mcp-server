import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { getConfluenceSpacesV2, getConfluenceSpaceV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
import { createJsonResource, createStandardResource } from '../../utils/mcp-resource.js';
import { spacesListSchema, spaceSchema } from '../../schemas/confluence.js';

const logger = Logger.getLogger('ConfluenceResource:Spaces');

/**
 * Helper function to get the list of spaces from Confluence API v2 (cursor-based)
 */
async function getSpacesV2(config: AtlassianConfig, cursor: string | undefined = undefined, limit = 25): Promise<any> {
  return await getConfluenceSpacesV2(config, cursor, limit);
}

/**
 * Helper function to get space details from Confluence API v2
 */
async function getSpaceV2(config: AtlassianConfig, spaceKey: string): Promise<any> {
  return await getConfluenceSpaceV2(config, spaceKey);
}

/**
 * Register Confluence space-related resources
 * @param server MCP Server instance
 */
export function registerSpaceResources(server: McpServer) {
  logger.info('Registering Confluence space resources...');

  // Resource: List of spaces (API v2, cursor-based)
  server.resource(
    'confluence-spaces-list',
    new ResourceTemplate('confluence://spaces', { list: undefined }),
    async (uri, params, extra) => {
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        // Lấy params cursor-based
        const limit = params && params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25;
        const cursor = params && params.cursor ? (Array.isArray(params.cursor) ? params.cursor[0] : params.cursor) : undefined;
        logger.info(`Getting Confluence spaces list (v2): cursor=${cursor}, limit=${limit}`);
        const data = await getSpacesV2(config, cursor, limit);
        // Format metadata v2
        const metadata = {
          total: data._links && data._links.next ? -1 : (data.results?.length || 0),
          limit: limit,
          hasMore: !!(data._links && data._links.next),
          links: {
            self: uri.href,
            next: data._links && data._links.next ? `${uri.href}?cursor=${encodeURIComponent(new URL(data._links.next, 'http://dummy').searchParams.get('cursor') || '')}&limit=${limit}` : undefined
          }
        };
        return createJsonResource(uri.href, {
          spaces: data.results,
          metadata
        });
      } catch (error) {
        logger.error(`Error getting Confluence spaces list (v2):`, error);
        throw error;
      }
    }
  );

  // Resource: Space details (API v2, mapping key -> id)
  server.resource(
    'confluence-space-details',
    new ResourceTemplate('confluence://spaces/{spaceKey}', { list: undefined }),
    async (uri, { spaceKey }, extra) => {
      let normalizedSpaceKey = '';
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        if (!spaceKey) {
          throw new Error('Missing spaceKey in URI');
        }
        normalizedSpaceKey = Array.isArray(spaceKey) ? spaceKey[0] : spaceKey;
        logger.info(`Getting details for Confluence space (v2) by key: ${normalizedSpaceKey}`);
        // Gọi API v2 lấy space theo key
        const url = `${config.baseUrl}/wiki/api/v2/spaces?key=${encodeURIComponent(normalizedSpaceKey)}`;
        const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}` } });
        if (!response.ok) {
          throw new Error(`Confluence API error: ${response.status} ${await response.text()}`);
        }
        const data = await response.json();
        if (!data.results || !data.results.length) {
          throw new Error(`Space with key ${normalizedSpaceKey} not found`);
        }
        const spaceId = data.results[0].id;
        // Gọi tiếp API lấy chi tiết space theo id
        const url2 = `${config.baseUrl}/wiki/api/v2/spaces/${spaceId}`;
        const response2 = await fetch(url2, { method: 'GET', headers: { 'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}` } });
        if (!response2.ok) {
          throw new Error(`Confluence API error: ${response2.status} ${await response2.text()}`);
        }
        const space = await response2.json();
        return createJsonResource(uri.href, {
          space,
          metadata: { self: uri.href }
        });
      } catch (error) {
        logger.error(`Error getting Confluence space details (v2) for ${normalizedSpaceKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of pages in a space
  server.resource(
    'confluence-space-pages',
    new ResourceTemplate('confluence://spaces/{spaceKey}/pages', { list: undefined }),
    async (uri, { spaceKey, start, limit }, extra) => {
      let normalizedSpaceKey = Array.isArray(spaceKey) ? spaceKey[0] : spaceKey;
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        if (!normalizedSpaceKey) {
          throw new Error('Missing spaceKey in URI');
        }
        // Lấy spaceId từ spaceKey
        const spaces = await getConfluenceSpacesV2(config, undefined, 250);
        const found = (spaces.results || []).find((s: any) => s.key === normalizedSpaceKey);
        if (!found) throw new Error(`Space with key ${normalizedSpaceKey} not found`);
        const spaceId = found.id;
        // Gọi helper lấy danh sách page theo space-id
        const filterParams = { 'space-id': spaceId, limit: limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : 25 };
        const data = await getConfluencePagesWithFilters(config, filterParams);
        // Format kết quả
        const formattedPages = (data.results || []).map((page: any) => ({
          id: page.id,
          title: page.title,
          status: page.status,
          url: `${config.baseUrl}/wiki/pages/${page.id}`
        }));
        return createJsonResource(uri.href, {
          pages: formattedPages,
          total: data.size || formattedPages.length,
          limit: filterParams.limit,
          message: `Found ${formattedPages.length} page(s) in space ${normalizedSpaceKey}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence pages in space ${normalizedSpaceKey}:`, error);
        throw error;
      }
    }
  );
}
