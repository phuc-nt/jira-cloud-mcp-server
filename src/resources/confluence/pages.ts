import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('ConfluenceResource:Pages');

/**
 * Hàm helper để lấy thông tin chi tiết page từ Confluence
 */
async function getPage(config: AtlassianConfig, pageId: string): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl.endsWith('/wiki')) {
      baseUrl = `${baseUrl}/wiki`;
    }
    const url = `${baseUrl}/rest/api/content/${encodeURIComponent(pageId)}?expand=body.storage,version,space`;
    logger.debug(`Getting Confluence page details: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      throw new Error(`Confluence API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error getting Confluence page details:`, error);
    throw error;
  }
}

/**
 * Hàm helper để tìm kiếm pages theo CQL từ Confluence (hỗ trợ phân trang)
 */
async function searchPagesByCql(config: AtlassianConfig, cql: string, start = 0, limit = 20): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl.endsWith('/wiki')) {
      baseUrl = `${baseUrl}/wiki`;
    }
    const url = `${baseUrl}/rest/api/content/search?cql=${encodeURIComponent(cql)}&start=${start}&limit=${limit}`;
    logger.debug(`Searching Confluence pages by CQL: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      throw new Error(`Confluence API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error searching Confluence pages by CQL:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách children của page
 */
async function getPageChildren(config: AtlassianConfig, pageId: string): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl.endsWith('/wiki')) {
      baseUrl = `${baseUrl}/wiki`;
    }
    const url = `${baseUrl}/rest/api/content/${encodeURIComponent(pageId)}/child/page`;
    logger.debug(`Getting children for Confluence page: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      throw new Error(`Confluence API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error getting Confluence page children:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách comments của page
 */
async function getPageComments(config: AtlassianConfig, pageId: string): Promise<any> {
  try {
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    if (!baseUrl.endsWith('/wiki')) {
      baseUrl = `${baseUrl}/wiki`;
    }
    const url = `${baseUrl}/rest/api/content/${encodeURIComponent(pageId)}/child/comment`;
    logger.debug(`Getting comments for Confluence page: ${url}`);
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      logger.error(`Confluence API error (${statusCode}):`, responseText);
      throw new Error(`Confluence API error: ${responseText}`);
    }
    const data = await response.json();
    return data;
  } catch (error) {
    logger.error(`Error getting Confluence page comments:`, error);
    throw error;
  }
}

/**
 * Đăng ký các resources liên quan đến Confluence pages
 * @param server MCP Server instance
 */
export function registerPageResources(server: McpServer) {
  logger.info('Registering Confluence page resources...');

  // Resource: Chi tiết page
  server.resource(
    'confluence-page-details',
    new ResourceTemplate('confluence://pages/{pageId}', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = '';
      try {
        // Lấy config từ context hoặc env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback lấy từ env
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
          throw new Error('Thiếu pageId trong URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        logger.info(`Getting details for Confluence page: ${normalizedPageId}`);
        const page = await getPage(config, normalizedPageId);
        // Định dạng lại dữ liệu trả về
        const formattedPage = {
          id: page.id,
          title: page.title,
          status: page.status,
          spaceKey: page.space?.key || '',
          version: page.version?.number || 1,
          body: page.body?.storage?.value || '',
          url: `${config.baseUrl}/wiki/pages/${page.id}`
        };
        return createJsonResource(uri.href, {
          page: formattedPage,
          message: `Thông tin chi tiết page ${normalizedPageId}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence page details for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Tìm kiếm pages theo CQL
  server.resource(
    'confluence-pages-search-cql',
    new ResourceTemplate('confluence://pages?cql={cql}', { list: undefined }),
    async (uri, params, extra) => {
      try {
        // Lấy config từ context hoặc env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback lấy từ env
          const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
          const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
          const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';
          config = {
            baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') ? `https://${ATLASSIAN_SITE_NAME}` : ATLASSIAN_SITE_NAME,
            email: ATLASSIAN_USER_EMAIL,
            apiToken: ATLASSIAN_API_TOKEN
          };
        }
        const cql = params && params.cql ? (Array.isArray(params.cql) ? params.cql[0] : params.cql) : '';
        if (!cql) {
          throw new Error('Thiếu tham số cql trong URI');
        }
        const start = params && params.start ? parseInt(Array.isArray(params.start) ? params.start[0] : params.start, 10) : 0;
        const limit = params && params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 20;
        logger.info(`Searching Confluence pages by CQL: cql="${cql}", start=${start}, limit=${limit}`);
        const data = await searchPagesByCql(config, cql, start, limit);
        // Định dạng lại danh sách pages
        const formattedPages = (data.results || []).map((page: any) => ({
          id: page.id,
          title: page.title,
          status: page.status,
          url: `${config.baseUrl}/wiki/pages/${page.id}`
        }));
        return createJsonResource(uri.href, {
          pages: formattedPages,
          total: data.size,
          start,
          limit,
          message: `Tìm thấy ${data.size} pages theo CQL, hiển thị từ ${start + 1} đến ${start + formattedPages.length}`
        });
      } catch (error) {
        logger.error(`Error searching Confluence pages by CQL:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách children của page
  server.resource(
    'confluence-page-children',
    new ResourceTemplate('confluence://pages/{pageId}/children', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = '';
      try {
        // Lấy config từ context hoặc env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback lấy từ env
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
          throw new Error('Thiếu pageId trong URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        logger.info(`Getting children for Confluence page: ${normalizedPageId}`);
        const data = await getPageChildren(config, normalizedPageId);
        // Định dạng lại danh sách children
        const formattedChildren = (data.results || []).map((child: any) => ({
          id: child.id,
          title: child.title,
          status: child.status,
          url: `${config.baseUrl}/wiki/pages/${child.id}`
        }));
        return createJsonResource(uri.href, {
          children: formattedChildren,
          count: formattedChildren.length,
          message: `Có ${formattedChildren.length} trang con cho page ${normalizedPageId}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence page children for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách comments của page
  server.resource(
    'confluence-page-comments',
    new ResourceTemplate('confluence://pages/{pageId}/comments', { list: undefined }),
    async (uri, { pageId }, extra) => {
      let normalizedPageId = '';
      try {
        // Lấy config từ context hoặc env
        let config: AtlassianConfig;
        if (extra && typeof extra === 'object' && 'context' in extra && extra.context && (extra.context as any).atlassianConfig) {
          config = (extra.context as any).atlassianConfig as AtlassianConfig;
        } else {
          // fallback lấy từ env
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
          throw new Error('Thiếu pageId trong URI');
        }
        normalizedPageId = Array.isArray(pageId) ? pageId[0] : pageId;
        logger.info(`Getting comments for Confluence page: ${normalizedPageId}`);
        const data = await getPageComments(config, normalizedPageId);
        // Định dạng lại danh sách comments
        const formattedComments = (data.results || []).map((comment: any) => ({
          id: comment.id,
          author: comment.creator?.displayName || '',
          body: comment.body?.storage?.value || '',
          created: comment.created,
          updated: comment.version?.when || ''
        }));
        return createJsonResource(uri.href, {
          comments: formattedComments,
          count: formattedComments.length,
          message: `Có ${formattedComments.length} bình luận cho page ${normalizedPageId}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence page comments for ${normalizedPageId}:`, error);
        throw error;
      }
    }
  );
}
