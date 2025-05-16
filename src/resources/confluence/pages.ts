import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import fetch from 'cross-fetch';
import { createStandardResource } from '../../utils/mcp-resource.js';
import { pagesListSchema, pageSchema, commentsListSchema } from '../../schemas/confluence.js';
import { getConfluencePagesV2, getConfluencePageV2, getConfluencePageBodyV2, getConfluencePageAncestorsV2, getConfluencePageChildrenV2, getConfluencePageLabelsV2, getConfluencePageAttachmentsV2, getConfluencePageVersionsV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
import { getConfluencePageFooterCommentsV2, getConfluencePageInlineCommentsV2 } from '../../utils/confluence-resource-api.js';
import { callConfluenceApi } from '../../utils/atlassian-api-base.js';

const logger = Logger.getLogger('ConfluenceResource:Pages');

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
    new ResourceTemplate('confluence://pages/{pageId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}',
            name: 'Confluence Page Details',
            description: 'Get details for a specific Confluence page by ID. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
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
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return {
          contents: [{
            uri: uriString,
            mimeType: 'application/json',
            text: JSON.stringify({
              page: formattedPage,
              metadata: { self: uriString }
            })
          }]
        };
      } catch (error) {
        logger.error(`Error getting Confluence page details (v2) for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of children pages
  server.resource(
    'confluence-page-children',
    new ResourceTemplate('confluence://pages/{pageId}/children', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/children',
            name: 'Confluence Page Children',
            description: 'List all children for a Confluence page. Replace {pageId} với ID trang.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
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
    new ResourceTemplate('confluence://pages/{pageId}/comments', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/comments',
            name: 'Confluence Page Comments',
            description: 'List comments for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
        }
        
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting comments for Confluence page (v2): ${normalizedPageId}`);

        // Get both footer and inline comments
        const footerComments = await getConfluencePageFooterCommentsV2(config, normalizedPageId);
        const inlineComments = await getConfluencePageInlineCommentsV2(config, normalizedPageId);

        // Format the comments to a simpler structure
        const formattedFooterComments = (footerComments.results || []).map((comment: any) => ({
          id: comment.id,
          parentId: comment.parentCommentId,
          content: comment.body && comment.body.rendered ? comment.body.rendered : '',
          contentRaw: comment.body && comment.body.storage ? comment.body.storage.value : '',
          type: 'footer',
          author: comment.authorId ? {
            accountId: comment.authorId,
            displayName: comment.authorName || 'Unknown'
          } : null,
          created: comment.created,
          updated: comment.lastModified,
          url: `${config.baseUrl}/wiki/pages/${normalizedPageId}?focusedCommentId=${comment.id}`
        }));

        const formattedInlineComments = (inlineComments.results || []).map((comment: any) => ({
          id: comment.id,
          parentId: comment.parentCommentId,
          content: comment.body && comment.body.rendered ? comment.body.rendered : '',
          contentRaw: comment.body && comment.body.storage ? comment.body.storage.value : '',
          type: 'inline',
          author: comment.authorId ? {
            accountId: comment.authorId,
            displayName: comment.authorName || 'Unknown'
          } : null,
          created: comment.created,
          updated: comment.lastModified,
          url: `${config.baseUrl}/wiki/pages/${normalizedPageId}?focusedCommentId=${comment.id}`
        }));

        // Combine both types of comments
        const allComments = [...formattedFooterComments, ...formattedInlineComments];
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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

  // Resource: Page ancestors (API v2, path hierarchy)
  server.resource(
    'confluence-page-ancestors',
    new ResourceTemplate('confluence://pages/{pageId}/ancestors', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/ancestors',
            name: 'Confluence Page Ancestors',
            description: 'List all ancestors for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
        }
        
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        
        logger.info(`Getting ancestors for Confluence page (v2): ${normalizedPageId}`);
        const data = await getPageAncestorsV2(config, normalizedPageId);
        
        // Format the ancestors
        const formattedAncestors = data.map((ancestor: any) => ({
          id: ancestor.id,
          title: ancestor.title,
          url: `${config.baseUrl}/wiki/pages/${ancestor.id}`
        }));
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return {
          contents: [{
            uri: uriString,
            mimeType: 'application/json',
            text: JSON.stringify({
              ancestors: formattedAncestors,
              metadata: {
                total: formattedAncestors.length,
                self: uriString,
                pageId: normalizedPageId
              }
            })
          }]
        };
      } catch (error) {
        logger.error(`Error getting Confluence page ancestors for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Attachments
  server.resource(
    'confluence-page-attachments',
    new ResourceTemplate('confluence://pages/{pageId}/attachments', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/attachments',
            name: 'Confluence Page Attachments',
            description: 'List attachments for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = '';
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
        }
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        logger.info(`Getting attachments for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageAttachmentsV2(config, normalizedPageId, safeCursor, safeLimit || 25);
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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
    new ResourceTemplate('confluence://pages/{pageId}/versions', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/versions',
            name: 'Confluence Page Versions',
            description: 'List versions for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, { pageId, limit, cursor }, extra) => {
      let normalizedPageId = '';
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
        }
        if (!pageId) {
          throw new Error('Missing pageId in URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        const safeCursor = Array.isArray(cursor) ? cursor[0] : cursor;
        const safeLimit = Array.isArray(limit) ? parseInt(limit[0], 10) : (limit ? parseInt(limit, 10) : undefined);
        logger.info(`Getting versions for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageVersionsV2(config, normalizedPageId, safeCursor, safeLimit || 25);
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return createStandardResource(
          uriString,
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
    new ResourceTemplate('confluence://pages', {
      list: async (_extra) => {
        return {
          resources: [
            {
              uri: 'confluence://pages',
              name: 'Confluence Pages',
              description: 'List and search all Confluence pages',
              mimeType: 'application/json'
            }
          ]
        };
      }
    }),
    async (uri, params, extra) => {
      try {
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          config = getAtlassianConfigFromEnv();
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
        
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return {
          contents: [{
            uri: uriString,
            mimeType: 'application/json',
            text: JSON.stringify({
              pages: data.results,
              metadata
            })
          }]
        };
      } catch (error) {
        logger.error(`Error getting Confluence pages list (v2, filter):`, error);
        throw error;
      }
    }
  );
  
  logger.info('Confluence page resources registered successfully');
}
