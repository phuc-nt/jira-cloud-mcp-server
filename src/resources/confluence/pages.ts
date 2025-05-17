import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { pagesListSchema, pageSchema, commentsListSchema, attachmentListSchema, versionListSchema, labelListSchema } from '../../schemas/confluence.js';
import { getConfluencePagesV2, getConfluencePageV2, getConfluencePageBodyV2, getConfluencePageAncestorsV2, getConfluencePageChildrenV2, getConfluencePageLabelsV2, getConfluencePageAttachmentsV2, getConfluencePageVersionsV2, getConfluencePagesWithFilters } from '../../utils/confluence-resource-api.js';
import { getConfluencePageFooterCommentsV2, getConfluencePageInlineCommentsV2 } from '../../utils/confluence-resource-api.js';
import { Config, Resources } from '../../utils/mcp-helpers.js';

const logger = Logger.getLogger('ConfluenceResource:Pages');

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
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting details for Confluence page (v2): ${normalizedPageId}`);
        const page = await getConfluencePageV2(config, normalizedPageId);
        let body = {};
        try {
          body = await getConfluencePageBodyV2(config, normalizedPageId);
        } catch (e) {
          body = {};
        }
        const formattedPage = {
          ...page,
          body: (body && typeof body === 'object' && 'value' in body) ? body.value : '',
          bodyType: (body && typeof body === 'object' && 'representation' in body) ? body.representation : 'storage',
        };
        const uriString = typeof uri === 'string' ? uri : uri.href;
        return Resources.createStandardResource(
          uriString,
          [formattedPage],
          'page',
          pageSchema,
          1,
          1,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
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
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting children for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageChildrenV2(config, normalizedPageId);
        const formattedChildren = (data.results || []).map((child: any) => ({
          id: child.id,
          title: child.title,
          status: child.status,
          url: `${config.baseUrl}/wiki/pages/${child.id}`
        }));
        const childrenSchema = { type: 'array', items: pageSchema };
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
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
    async (uri, { pageId }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting comments for Confluence page (v2): ${normalizedPageId}`);
        const footerComments = await getConfluencePageFooterCommentsV2(config, normalizedPageId);
        const inlineComments = await getConfluencePageInlineCommentsV2(config, normalizedPageId);
        const allComments = [...(footerComments.results || []), ...(inlineComments.results || [])];
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
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

  // Resource: List of ancestors for a page
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
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting ancestors for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageAncestorsV2(config, normalizedPageId);
        const ancestors = Array.isArray(data?.results) ? data.results : [];
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
          ancestors,
          'ancestors',
          { type: 'array', items: pageSchema },
          ancestors.length,
          ancestors.length,
          0,
          `${config.baseUrl}/wiki/pages/${normalizedPageId}`
        );
      } catch (error) {
        logger.error(`Error getting Confluence page ancestors for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of attachments for a page
  server.resource(
    'confluence-page-attachments',
    new ResourceTemplate('confluence://pages/{pageId}/attachments', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/attachments',
            name: 'Confluence Page Attachments',
            description: 'List all attachments for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, extra) => {
      let normalizedPageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
      try {
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting attachments for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageAttachmentsV2(config, normalizedPageId);
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
          data.results || [],
          'attachments',
          attachmentListSchema,
          data.size || (data.results || []).length,
          data.limit || (data.results || []).length,
          0,
          undefined
        );
      } catch (error) {
        logger.error(`Error getting Confluence page attachments for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of versions for a page
  server.resource(
    'confluence-page-versions',
    new ResourceTemplate('confluence://pages/{pageId}/versions', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages/{pageId}/versions',
            name: 'Confluence Page Versions',
            description: 'List all versions for a Confluence page. Replace {pageId} with the page ID.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, extra) => {
      let normalizedPageId = Array.isArray(params.pageId) ? params.pageId[0] : params.pageId;
      try {
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting versions for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageVersionsV2(config, normalizedPageId);
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
          data.results || [],
          'versions',
          versionListSchema,
          data.size || (data.results || []).length,
          data.limit || (data.results || []).length,
          0,
          undefined
        );
      } catch (error) {
        logger.error(`Error getting Confluence page versions for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: List of pages (search/filter)
  server.resource(
    'confluence-pages-list',
    new ResourceTemplate('confluence://pages', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'confluence://pages',
            name: 'Confluence Pages',
            description: 'List and search all Confluence pages',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, extra) => {
      let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
        ? (extra.context as any).atlassianConfig
        : Config.getAtlassianConfigFromEnv();
      const filterParams = { ...params };
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
        filterParams.limit || formattedPages.length,
        0,
        undefined
      );
    }
  );

  // Resource: List of labels for a page
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
    async (uri, { pageId }, extra) => {
      let normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
      try {
        let config = (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig)
          ? (extra.context as any).atlassianConfig
          : Config.getAtlassianConfigFromEnv();
        if (!normalizedPageId) {
          throw new Error('Missing pageId in URI');
        }
        logger.info(`Getting labels for Confluence page (v2): ${normalizedPageId}`);
        const data = await getConfluencePageLabelsV2(config, normalizedPageId);
        const formattedLabels = (data.results || []).map((label: any) => ({
          id: label.id,
          name: label.name,
          prefix: label.prefix
        }));
        return Resources.createStandardResource(
          typeof uri === 'string' ? uri : uri.href,
          formattedLabels,
          'labels',
          labelListSchema,
          data.size || formattedLabels.length,
          data.limit || formattedLabels.length,
          0,
          undefined
        );
      } catch (error) {
        logger.error(`Error getting Confluence page labels for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );
}
