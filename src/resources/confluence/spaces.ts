import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { getConfluenceSpacesV2, getConfluenceSpaceV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
import { spacesListSchema, spaceSchema, pagesListSchema } from '../../schemas/confluence.js';
import { Config, Resources } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceResource:Spaces');

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
      const config = Config.getAtlassianConfigFromEnv();
      const limit = params?.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 25;
      const cursor = params?.cursor ? (Array.isArray(params.cursor) ? params.cursor[0] : params.cursor) : undefined;
      logger.info(`Getting Confluence spaces list (v2): cursor=${cursor}, limit=${limit}`);
      const data = await getConfluenceSpacesV2(config, cursor, limit);
      const uriString = typeof uri === 'string' ? uri : uri.href;
      // Chuẩn hóa metadata cho cursor-based
      const total = data.size ?? (data.results?.length || 0);
      const hasMore = !!(data._links && data._links.next);
      const nextCursor = hasMore ? (new URL(data._links.next, 'http://dummy').searchParams.get('cursor') || '') : undefined;
      const metadata = {
        total,
        limit,
        hasMore,
        links: {
          self: uriString,
          next: hasMore && nextCursor ? `${uriString}?cursor=${encodeURIComponent(nextCursor)}&limit=${limit}` : undefined
        }
      };
      // Chuẩn hóa trả về
      return Resources.createStandardResource(
        uriString,
        data.results,
        'spaces',
        spacesListSchema,
        total,
        limit,
        0,
        undefined
      );
    }
  );

  // Resource: Space details (API v2, mapping id)
  server.resource(
    'confluence-space-details',
    new ResourceTemplate('confluence://spaces/{spaceId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://spaces/{spaceId}',
            name: 'Confluence Space Details',
            description: 'Get details for a specific Confluence space by id. Replace {spaceId} với id số của space (ví dụ: 19464200).',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      const config = Config.getAtlassianConfigFromEnv();
      let normalizedSpaceId = Array.isArray(params.spaceId) ? params.spaceId[0] : params.spaceId;
      if (!normalizedSpaceId) throw new Error('Missing spaceId in URI');
      if (!/^\d+$/.test(normalizedSpaceId)) throw new Error('spaceId must be a number');
      logger.info(`Getting details for Confluence space (v2) by id: ${normalizedSpaceId}`);
      // Lấy thông tin space qua API helper (giả sử getConfluenceSpaceV2 hỗ trợ lookup theo id)
      const space = await getConfluenceSpaceV2(config, normalizedSpaceId);
      const uriString = typeof uri === 'string' ? uri : uri.href;
      return Resources.createStandardResource(
        uriString,
        [space],
        'space',
        spaceSchema,
        1,
        1,
        0,
        undefined
      );
    }
  );

  // Resource: List of pages in a space
  server.resource(
    'confluence-space-pages',
    new ResourceTemplate('confluence://spaces/{spaceId}/pages', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://spaces/{spaceId}/pages',
            name: 'Confluence Space Pages',
            description: 'List all pages in a specific Confluence space. Replace {spaceId} với id số của space.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      const config = Config.getAtlassianConfigFromEnv();
      let normalizedSpaceId = Array.isArray(params.spaceId) ? params.spaceId[0] : params.spaceId;
      if (!normalizedSpaceId) throw new Error('Missing spaceId in URI');
      if (!/^\d+$/.test(normalizedSpaceId)) throw new Error('spaceId must be a number');
      // Không lookup theo key nữa, dùng trực tiếp id
      const filterParams = {
        'space-id': normalizedSpaceId,
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
      return Resources.createStandardResource(
        uriString,
        formattedPages,
        'pages',
        pagesListSchema,
        data.size || formattedPages.length,
        filterParams.limit,
        0,
        undefined
      );
    }
  );
}
