import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { getConfluenceSpacesV2, getConfluenceSpaceV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
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
 * Register Confluence space-related resources
 * @param server MCP Server instance
 */
export function registerSpaceResources(server: McpServer) {
  logger.info('Registering Confluence space resources...');

  // Resource: List of spaces (API v2, cursor-based)
  server.resource(
    'confluence-spaces-list',
    new ResourceTemplate('confluence://spaces', {
      list: async (_extra) => {
        return {
          resources: [
            {
              uri: 'confluence://spaces',
              name: 'Confluence Spaces',
              description: 'List and search all Confluence spaces',
              mimeType: 'application/json'
            }
          ]
        };
      }
    }),
    async (uri, params, _extra) => {
      // Get config from environment
      const config = getAtlassianConfigFromEnv();
      const limit = params?.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25;
      const cursor = params?.cursor ? (Array.isArray(params.cursor) ? params.cursor[0] : params.cursor) : undefined;
      
      logger.info(`Getting Confluence spaces list (v2): cursor=${cursor}, limit=${limit}`);
      const data = await getSpacesV2(config, cursor, limit);
      
      const uriString = typeof uri === 'string' ? uri : uri.href;
      const metadata = {
        total: data._links && data._links.next ? -1 : (data.results?.length || 0),
        limit: limit,
        hasMore: !!(data._links && data._links.next),
        links: {
          self: uriString,
          next: data._links && data._links.next ? 
            `${uriString}?cursor=${encodeURIComponent(new URL(data._links.next, 'http://dummy').searchParams.get('cursor') || '')}&limit=${limit}` : 
            undefined
        }
      };
      
      return {
        contents: [{
          uri: uriString,
          mimeType: 'application/json',
          text: JSON.stringify({
            spaces: data.results,
            metadata
          })
        }]
      };
    }
  );

  // Resource: Space details (API v2, mapping key -> id)
  server.resource(
    'confluence-space-details',
    new ResourceTemplate('confluence://spaces/{spaceKey}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://spaces/{spaceKey}',
            name: 'Confluence Space Details',
            description: 'Get details for a specific Confluence space by key. Replace {spaceKey} with the space key.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      // Get config from environment
      const config = getAtlassianConfigFromEnv();
      let normalizedSpaceKey = Array.isArray(params.spaceKey) ? params.spaceKey[0] : params.spaceKey;
      
      if (!normalizedSpaceKey) throw new Error('Missing spaceKey in URI');
      logger.info(`Getting details for Confluence space (v2) by key: ${normalizedSpaceKey}`);
      
      const url = `${config.baseUrl}/wiki/api/v2/spaces?key=${encodeURIComponent(normalizedSpaceKey)}`;
      const response = await fetch(url, { 
        method: 'GET', 
        headers: { 'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}` } 
      });
      
      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status} ${await response.text()}`);
      }
      
      const data = await response.json();
      if (!data.results || !data.results.length) {
        throw new Error(`Space with key ${normalizedSpaceKey} not found`);
      }
      
      const spaceId = data.results[0].id;
      const url2 = `${config.baseUrl}/wiki/api/v2/spaces/${spaceId}`;
      const response2 = await fetch(url2, { 
        method: 'GET', 
        headers: { 'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}` } 
      });
      
      if (!response2.ok) {
        throw new Error(`Confluence API error: ${response2.status} ${await response2.text()}`);
      }
      
      const space = await response2.json();
      const uriString = typeof uri === 'string' ? uri : uri.href;
      
      return {
        contents: [{
          uri: uriString,
          mimeType: 'application/json',
          text: JSON.stringify({
            space,
            metadata: { self: uriString }
          })
        }]
      };
    }
  );

  // Resource: List of pages in a space
  server.resource(
    'confluence-space-pages',
    new ResourceTemplate('confluence://spaces/{spaceKey}/pages', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://spaces/{spaceKey}/pages',
            name: 'Confluence Space Pages',
            description: 'List all pages in a specific Confluence space. Replace {spaceKey} with the space key.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      // Get config from environment
      const config = getAtlassianConfigFromEnv();
      let normalizedSpaceKey = Array.isArray(params.spaceKey) ? params.spaceKey[0] : params.spaceKey;
      
      if (!normalizedSpaceKey) throw new Error('Missing spaceKey in URI');
      
      const spaces = await getConfluenceSpacesV2(config, undefined, 250);
      const found = (spaces.results || []).find((s: any) => s.key === normalizedSpaceKey);
      if (!found) throw new Error(`Space with key ${normalizedSpaceKey} not found`);
      
      const spaceId = found.id;
      const filterParams = { 
        'space-id': spaceId, 
        limit: params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25 
      };
      
      const data = await getConfluencePagesWithFilters(config, filterParams);
      const formattedPages = (data.results || []).map((page: any) => ({
        id: page.id,
        title: page.title,
        status: page.status,
        url: `${config.baseUrl}/wiki/pages/${page.id}`
      }));
      
      const uriString = typeof uri === 'string' ? uri : uri.href;
      
      return {
        contents: [{
          uri: uriString,
          mimeType: 'application/json',
          text: JSON.stringify({
            pages: formattedPages,
            total: data.size || formattedPages.length,
            limit: filterParams.limit,
            message: `Found ${formattedPages.length} page(s) in space ${normalizedSpaceKey}`
          })
        }]
      };
    }
  );
}
