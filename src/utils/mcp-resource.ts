import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig } from './atlassian-api.js';
import { Logger } from './logger.js';

const logger = Logger.getLogger('MCPResource');

/**
 * Tạo resource response với nội dung JSON
 * @param uri URI của resource
 * @param data Dữ liệu JSON để trả về
 * @returns Đối tượng resource response chuẩn MCP
 */
export function createJsonResource(uri: string, data: any) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "application/json",
        text: JSON.stringify(data)
      }
    ]
  };
}

/**
 * Tạo resource response với nội dung text
 * @param uri URI của resource
 * @param data Dữ liệu text để trả về
 * @returns Đối tượng resource response chuẩn MCP
 */
export function createTextResource(uri: string, data: string) {
  return {
    contents: [
      {
        uri: uri,
        mimeType: "text/plain",
        text: data
      }
    ]
  };
}

/**
 * Định nghĩa kiểu cho handler function của resource
 */
export type ResourceHandlerFunction = (
  params: any, 
  context: { config: AtlassianConfig; uri: string }
) => Promise<any>;

// Cấu hình Atlassian từ biến môi trường
const getAtlassianConfigFromEnv = (): AtlassianConfig => {
  const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
  const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

  if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
    logger.error('Missing Atlassian credentials in environment variables');
    throw new Error('Missing Atlassian credentials in environment variables');
  }

  return {
    baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
      ? `https://${ATLASSIAN_SITE_NAME}` 
      : ATLASSIAN_SITE_NAME,
    email: ATLASSIAN_USER_EMAIL,
    apiToken: ATLASSIAN_API_TOKEN
  };
};

/**
 * Đăng ký resource với MCP Server
 * @param server MCP Server instance
 * @param resourceName Tên resource
 * @param resourceUri URI pattern của resource
 * @param description Mô tả về resource
 * @param handler Hàm xử lý request cho resource
 */
export function registerResource(
  server: McpServer, 
  resourceName: string,
  resourceUri: string | any, // chấp nhận ResourceTemplate
  description: string, 
  handler: ResourceHandlerFunction
) {
  logger.info(`Registering resource: ${resourceName} (${resourceUri instanceof Object && 'pattern' in resourceUri ? resourceUri.pattern : resourceUri})`);
  
  // Đăng ký resource với MCP Server theo đúng định nghĩa API
  server.resource(resourceName, resourceUri, 
    // Callback function cho ReadResourceCallback
    async (uri, extra) => {
      try {
        logger.info(`Handling resource request for: ${uri.href}`);
        
        // Lấy cấu hình Atlassian từ extra.context nếu có, ngược lại lấy từ biến môi trường
        let config: AtlassianConfig;
        try {
          // Truy cập an toàn vào context
          if (extra && typeof extra === 'object' && 'context' in extra && extra.context) {
            config = (extra.context as any).atlassianConfig as AtlassianConfig;
            
            // Nếu không có atlassianConfig trong context, tạo từ biến môi trường
            if (!config) {
              logger.warn(`atlassianConfig not found in context for resource: ${uri.href}, using env vars instead`);
              config = getAtlassianConfigFromEnv();
            }
          } else {
            // Nếu không có context, tạo từ biến môi trường
            logger.warn(`context not found in extra for resource: ${uri.href}, using env vars instead`);
            config = getAtlassianConfigFromEnv();
          }
        } catch (err) {
          // Fallback: tạo từ biến môi trường
          logger.warn(`Error accessing context for resource: ${uri.href}, using env vars instead`);
          config = getAtlassianConfigFromEnv();
        }
        
        // Gọi handler function với params và context
        const result = await handler({}, { config, uri: uri.href });
        logger.debug(`Resource result for ${uri.href}:`, result);
        
        return result;
      } catch (error) {
        logger.error(`Error in resource handler for ${uri.href}:`, error);
        throw error;
      }
    }
  );
}
