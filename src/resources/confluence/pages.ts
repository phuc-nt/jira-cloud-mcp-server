import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource, createStandardResource } from '../../utils/mcp-resource.js';
import { pagesListSchema, pageSchema, commentsListSchema } from '../../schemas/confluence.js';
import { getConfluencePagesV2, getConfluencePageV2, getConfluencePageBodyV2, getConfluencePageAncestorsV2, getConfluencePageChildrenV2, getConfluencePageCommentsV2, searchConfluencePagesByCqlV2, getConfluencePageFooterCommentsV2, getConfluencePageInlineCommentsV2, getConfluencePageLabelsV2, getConfluencePageAttachmentsV2, getConfluencePageVersionsV2, callConfluenceApi, getConfluencePagesWithFilters } from '../../utils/atlassian-api.js';

const logger = Logger.getLogger('ConfluenceResource:Pages');

/**
 * Helper function to get the list of pages from Confluence API v2 (cursor-based)
 */
async function getPagesV2(config: AtlassianConfig, cursor: string | undefined = undefined, limit = 25): Promise<any> {
  return await getConfluencePagesV2(config, cursor, limit);
}

/**
 * Helper function to get page details from Confluence API v2 (metadata only)
 */
async function getPageV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await getConfluencePageV2(config, pageId);
}

/**
 * Helper function to get page body from Confluence API v2
 */
async function getPageBodyV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await getConfluencePageBodyV2(config, pageId);
}

/**
 * Helper function to get page ancestors from Confluence API v2
 */
async function getPageAncestorsV2(config: AtlassianConfig, pageId: string): Promise<any> {
  return await getConfluencePageAncestorsV2(config, pageId);
}

/**
 * Register Confluence page-related resources
 * @param server MCP Server instance
 */
export function registerPageResources(server: McpServer) {
  logger.info('Registering Confluence page resources...');

  // Resource: Page details (API v2, tách call metadata và body)
  server.resource(
    'confluence-page-details-v2',
    new ResourceTemplate('confluence://pages/{pageId}', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
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
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting details for Confluence page (v2): ${normalizedPageId}`);
        const page = await getPageV2(config, normalizedPageId);
        let body = {};
        try {
          body = await getPageBodyV2(config, normalizedPageId);
        } catch (e) {
          body = {};
        }
        const formattedPage = {
          ...page,
          body: (body && typeof body === 'object' && 'value' in body) ? body.value : '',
          bodyType: (body && typeof body === 'object' && 'representation' in body) ? body.representation : 'storage',
        };
        return createJsonResource(uri.href, {
          page: formattedPage,
          metadata: { self: uri.href }
        });
      } catch (error) {
        logger.error(`Error getting Confluence page details (v2) for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of children pages
  server.resource(
    'confluence-page-children',
    new ResourceTemplate('confluence://pages/{pageId}/children', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = '';
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
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        logger.info(`Getting children for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageChildrenV2(config, normalizedPageId);
        // Format the list of children
        const formattedChildren = (data.results || []).map((child: any) => ({
          id: child.id,
          title: child.title,
          status: child.status,
          url: `${config.baseUrl}/wiki/pages/${child.id}`
        }));
        // Chuẩn hóa metadata/schema (array of pageSchema)
        const childrenSchema = {
          type: "array",
          items: pageSchema
        };
        return createStandardResource(
          uri.href,
          formattedChildren,
          'children',
          childrenSchema,
          formattedChildren.length,
          formattedChildren.length,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page children for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of comments for a page (API v2, gộp cả footer và inline)
  server.resource(
    'confluence-page-comments',
    new ResourceTemplate('confluence://pages/{pageId}/comments', { list: undefined }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
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
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        const params: { limit?: number, cursor?: string } = { limit: safeLimit || 25 };
        if (safeCursor) params.cursor = safeCursor;
        // Gọi cả hai endpoint
        const footerComments = await getConfluencePageFooterCommentsV2(config, normalizedPageId, params);
        const inlineComments = await getConfluencePageInlineCommentsV2(config, normalizedPageId, params);
        const allComments = [...(footerComments.results || []), ...(inlineComments.results || [])];
        return createStandardResource(
          uri.href,
          allComments,
          'comments',
          commentsListSchema,
          allComments.length,
          allComments.length,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page comments for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Page ancestors (API v2)
  server.resource(
    'confluence-page-ancestors-v2',
    new ResourceTemplate('confluence://pages/{pageId}/ancestors', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = '';
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
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        logger.info(`Getting ancestors for Confluence page (v2): ${normalizedPageId}`);
        const data = await getPageAncestorsV2(config, normalizedPageId);
        // Mapping schema mới
        const ancestors = data.results || [];
        const metadata = {
          total: ancestors.length,
          limit: ancestors.length,
          hasMore: false,
          links: { self: uri.href }
        };
        return createJsonResource(uri.href, {
          ancestors,
          metadata
        });
      } catch (error) {
        logger.error(`Error getting Confluence page ancestors (v2) for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Labels
  server.resource(
    'confluence-page-labels',
    new ResourceTemplate('confluence://pages/{pageId}/labels', { list: undefined }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = '';
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
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        logger.info(`Getting labels for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageLabelsV2(config, normalizedPageId, safeCursor, safeLimit || 25);
        return createStandardResource(
          uri.href,
          data.results || [],
          'labels',
          undefined,
          data.results?.length || 0,
          data.results?.length || 0,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page labels for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Attachments
  server.resource(
    'confluence-page-attachments',
    new ResourceTemplate('confluence://pages/{pageId}/attachments', { list: undefined }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = '';
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
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        logger.info(`Getting attachments for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageAttachmentsV2(config, normalizedPageId, safeCursor, safeLimit || 25);
        return createStandardResource(
          uri.href,
          data.results || [],
          'attachments',
          undefined,
          data.results?.length || 0,
          data.results?.length || 0,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page attachments for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Versions
  server.resource(
    'confluence-page-versions',
    new ResourceTemplate('confluence://pages/{pageId}/versions', { list: undefined }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = '';
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
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        logger.info(`Getting versions for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageVersionsV2(config, normalizedPageId, safeCursor, safeLimit || 25);
        return createStandardResource(
          uri.href,
          data.results || [],
          'versions',
          undefined,
          data.results?.length || 0,
          data.results?.length || 0,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page versions for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Search pages (không dùng cql, chỉ filter chuẩn v2)
  server.resource(
    'confluence-pages-list-filter',
    new ResourceTemplate('confluence://pages', { list: undefined }),
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
        logger.info('Raw params from client:', params);
        // Mapping filter đúng chuẩn v2, hỗ trợ các biến thể tên phổ biến
        const filterParams: Record<string, any> = {};
        // space-id
        if (params['space-id']) filterParams['space-id'] = Array.isArray(params['space-id']) ? params['space-id'].join(',') : params['space-id'];
        else if (params['spaceId']) filterParams['space-id'] = Array.isArray(params['spaceId']) ? params['spaceId'].join(',') : params['spaceId'];
        else if (params['space_id']) filterParams['space-id'] = Array.isArray(params['space_id']) ? params['space_id'].join(',') : params['space_id'];
        // label
        if (params['label']) filterParams['label'] = Array.isArray(params['label']) ? params['label'].join(',') : params['label'];
        // status
        if (params['status']) filterParams['status'] = Array.isArray(params['status']) ? params['status'].join(',') : params['status'];
        // title
        if (params['title']) filterParams['title'] = params['title'];
        // body-format
        if (params['body-format']) filterParams['body-format'] = params['body-format'];
        else if (params['bodyFormat']) filterParams['body-format'] = params['bodyFormat'];
        else if (params['body_format']) filterParams['body-format'] = params['body_format'];
        // sort
        if (params['sort']) filterParams['sort'] = params['sort'];
        // cursor
        if (params['cursor']) filterParams['cursor'] = params['cursor'];
        // limit
        if (params['limit']) filterParams['limit'] = params['limit'];
        logger.info(`Getting Confluence pages list (v2, filter):`, filterParams);
        // Gọi API v2 với filter đúng chuẩn
        const data = await getConfluencePagesWithFilters(config, filterParams);
        // Format metadata v2
        const metadata = {
          total: data._links && data._links.next ? -1 : (data.results?.length || 0),
          limit: filterParams['limit'] || 25,
          hasMore: !!(data._links && data._links.next),
          links: {
            self: uri.href,
            next: data._links && data._links.next ? `${uri.href}?cursor=${encodeURIComponent(new URL(data._links.next, 'http://dummy').searchParams.get('cursor') || '')}&limit=${filterParams['limit'] || 25}` : undefined
          }
        };
        return createJsonResource(uri.href, {
          pages: data.results,
          metadata
        });
      } catch (error) {
        logger.error(`Error getting Confluence pages list (v2, filter):`, error);
        throw error;
      }
    }
  );
}
