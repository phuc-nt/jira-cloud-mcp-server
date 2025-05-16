import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { getConfluenceSpacesV2, getConfluenceSpaceV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
import { createJsonResource, createStandardResource, registerResource } from '../../utils/mcp-resource.js';
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
  registerResource(
    server,
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
    'Confluence spaces list resource',
    async (params: any, context: { config: AtlassianConfig, uri: string }) => {
      const limit = params && params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25;
      const cursor = params && params.cursor ? (Array.isArray(params.cursor) ? params.cursor[0] : params.cursor) : undefined;
      logger.info(`Getting Confluence spaces list (v2): cursor=${cursor}, limit=${limit}`);
      const data = await getSpacesV2(context.config, cursor, limit);
      const metadata = {
        total: data._links && data._links.next ? -1 : (data.results?.length || 0),
        limit: limit,
        hasMore: !!(data._links && data._links.next),
        links: {
          self: context.uri,
          next: data._links && data._links.next ? `${context.uri}?cursor=${encodeURIComponent(new URL(data._links.next, 'http://dummy').searchParams.get('cursor') || '')}&limit=${limit}` : undefined
        }
      };
      return createJsonResource(context.uri, {
        spaces: data.results,
        metadata
      });
    }
  );

  // Resource: Space details (API v2, mapping key -> id)
  registerResource(
    server,
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
    'Confluence space details resource',
    async (params: any, context: { config: AtlassianConfig, uri: string }) => {
      let normalizedSpaceKey = Array.isArray(params.spaceKey) ? params.spaceKey[0] : params.spaceKey;
      if (!normalizedSpaceKey) throw new Error('Missing spaceKey in URI');
      logger.info(`Getting details for Confluence space (v2) by key: ${normalizedSpaceKey}`);
      const url = `${context.config.baseUrl}/wiki/api/v2/spaces?key=${encodeURIComponent(normalizedSpaceKey)}`;
      const response = await fetch(url, { method: 'GET', headers: { 'Authorization': `Basic ${Buffer.from(`${context.config.email}:${context.config.apiToken}`).toString('base64')}` } });
      if (!response.ok) {
        throw new Error(`Confluence API error: ${response.status} ${await response.text()}`);
      }
      const data = await response.json();
      if (!data.results || !data.results.length) {
        throw new Error(`Space with key ${normalizedSpaceKey} not found`);
      }
      const spaceId = data.results[0].id;
      const url2 = `${context.config.baseUrl}/wiki/api/v2/spaces/${spaceId}`;
      const response2 = await fetch(url2, { method: 'GET', headers: { 'Authorization': `Basic ${Buffer.from(`${context.config.email}:${context.config.apiToken}`).toString('base64')}` } });
      if (!response2.ok) {
        throw new Error(`Confluence API error: ${response2.status} ${await response2.text()}`);
      }
      const space = await response2.json();
      return createJsonResource(context.uri, {
        space,
        metadata: { self: context.uri }
      });
    }
  );

  // Resource: List of pages in a space
  registerResource(
    server,
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
    'Confluence space pages resource',
    async (params: any, context: { config: AtlassianConfig, uri: string }) => {
      let normalizedSpaceKey = Array.isArray(params.spaceKey) ? params.spaceKey[0] : params.spaceKey;
      if (!normalizedSpaceKey) throw new Error('Missing spaceKey in URI');
      const spaces = await getConfluenceSpacesV2(context.config, undefined, 250);
      const found = (spaces.results || []).find((s: any) => s.key === normalizedSpaceKey);
      if (!found) throw new Error(`Space with key ${normalizedSpaceKey} not found`);
      const spaceId = found.id;
      const filterParams = { 'space-id': spaceId, limit: params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25 };
      const data = await getConfluencePagesWithFilters(context.config, filterParams);
      const formattedPages = (data.results || []).map((page: any) => ({
        id: page.id,
        title: page.title,
        status: page.status,
        url: `${context.config.baseUrl}/wiki/pages/${page.id}`
      }));
      return createJsonResource(context.uri, {
        pages: formattedPages,
        total: data.size || formattedPages.length,
        limit: filterParams.limit,
        message: `Found ${formattedPages.length} page(s) in space ${normalizedSpaceKey}`
      });
    }
  );
}
