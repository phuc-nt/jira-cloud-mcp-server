import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import fetch from 'cross-fetch';
import { createJsonResource } from '../../utils/mcp-resource.js';

const logger = Logger.getLogger('ConfluenceResource:Spaces');

/**
 * Hàm helper để lấy danh sách spaces từ Confluence (hỗ trợ phân trang)
 */
async function getSpaces(config: AtlassianConfig, start = 0, limit = 20): Promise<any> {
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
    // Đảm bảo có /wiki cho API Confluence Cloud
    if (!baseUrl.endsWith('/wiki')) {
      baseUrl = `${baseUrl}/wiki`;
    }
    const url = `${baseUrl}/rest/api/space?start=${start}&limit=${limit}`;
    logger.debug(`Getting Confluence spaces: ${url}`);
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
    logger.error(`Error getting Confluence spaces:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy thông tin chi tiết space từ Confluence
 */
async function getSpace(config: AtlassianConfig, spaceKey: string): Promise<any> {
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
    const url = `${baseUrl}/rest/api/space/${encodeURIComponent(spaceKey)}`;
    logger.debug(`Getting Confluence space details: ${url}`);
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
    logger.error(`Error getting Confluence space details:`, error);
    throw error;
  }
}

/**
 * Hàm helper để lấy danh sách pages trong một space từ Confluence (hỗ trợ phân trang)
 */
async function getSpacePages(config: AtlassianConfig, spaceKey: string, start = 0, limit = 20): Promise<any> {
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
    const url = `${baseUrl}/rest/api/space/${encodeURIComponent(spaceKey)}/content/page?start=${start}&limit=${limit}`;
    logger.debug(`Getting Confluence pages in space: ${url}`);
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
    logger.error(`Error getting Confluence pages in space:`, error);
    throw error;
  }
}

/**
 * Đăng ký các resources liên quan đến Confluence spaces
 * @param server MCP Server instance
 */
export function registerSpaceResources(server: McpServer) {
  logger.info('Registering Confluence space resources...');

  // Resource: Danh sách spaces (hỗ trợ phân trang)
  server.resource(
    'confluence-spaces-list',
    new ResourceTemplate('confluence://spaces', { list: undefined }),
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
        // Lấy tham số phân trang nếu có
        const start = params && params.start ? parseInt(Array.isArray(params.start) ? params.start[0] : params.start, 10) : 0;
        const limit = params && params.limit ? parseInt(Array.isArray(params.limit) ? params.limit[0] : params.limit, 10) : 20;
        logger.info(`Getting Confluence spaces list: start=${start}, limit=${limit}`);
        const data = await getSpaces(config, start, limit);
        // Định dạng lại danh sách spaces
        const formattedSpaces = (data.results || []).map((space: any) => ({
          key: space.key,
          name: space.name,
          type: space.type,
          status: space.status,
          url: `${config.baseUrl}/wiki/spaces/${space.key}`
        }));
        return createJsonResource(uri.href, {
          spaces: formattedSpaces,
          total: data.size,
          start,
          limit,
          message: `Tìm thấy ${data.size} spaces, hiển thị từ ${start + 1} đến ${start + formattedSpaces.length}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence spaces list:`, error);
        throw error;
      }
    }
  );

  // Resource: Chi tiết space
  server.resource(
    'confluence-space-details',
    new ResourceTemplate('confluence://spaces/{spaceKey}', { list: undefined }),
    async (uri, { spaceKey }, extra) => {
      let normalizedSpaceKey = '';
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
        if (!spaceKey) {
          throw new Error('Thiếu spaceKey trong URI');
        }
        normalizedSpaceKey = Array.isArray(spaceKey) ? spaceKey[0] : spaceKey;
        logger.info(`Getting details for Confluence space: ${normalizedSpaceKey}`);
        const space = await getSpace(config, normalizedSpaceKey);
        // Định dạng lại dữ liệu trả về
        const formattedSpace = {
          key: space.key,
          name: space.name,
          type: space.type,
          status: space.status,
          description: space.description?.plain?.value || '',
          url: `${config.baseUrl}/wiki/spaces/${space.key}`
        };
        return createJsonResource(uri.href, {
          space: formattedSpace,
          message: `Thông tin chi tiết space ${normalizedSpaceKey}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence space details for ${normalizedSpaceKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: Danh sách pages trong một space
  server.resource(
    'confluence-space-pages',
    new ResourceTemplate('confluence://spaces/{spaceKey}/pages', { list: undefined }),
    async (uri, { spaceKey, start, limit }, extra) => {
      let normalizedSpaceKey = '';
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
        if (!spaceKey) {
          throw new Error('Thiếu spaceKey trong URI');
        }
        normalizedSpaceKey = Array.isArray(spaceKey) ? spaceKey[0] : spaceKey;
        const startVal = start ? parseInt(Array.isArray(start) ? start[0] : start, 10) : 0;
        const limitVal = limit ? parseInt(Array.isArray(limit) ? limit[0] : limit, 10) : 20;
        logger.info(`Getting pages for Confluence space: ${normalizedSpaceKey}, start=${startVal}, limit=${limitVal}`);
        const data = await getSpacePages(config, normalizedSpaceKey, startVal, limitVal);
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
          start: startVal,
          limit: limitVal,
          message: `Tìm thấy ${data.size} pages trong space ${normalizedSpaceKey}, hiển thị từ ${startVal + 1} đến ${startVal + formattedPages.length}`
        });
      } catch (error) {
        logger.error(`Error getting Confluence pages in space ${normalizedSpaceKey}:`, error);
        throw error;
      }
    }
  );
}
