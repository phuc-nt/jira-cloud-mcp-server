import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:getSpaces');

// Schema cho tham số đầu vào
export const getSpacesSchema = z.object({
  limit: z.number().optional().default(25).describe('Số lượng spaces tối đa để lấy'),
  type: z.enum(['global', 'personal', 'archived']).optional().describe('Loại space để lọc'),
  status: z.enum(['current', 'archived']).optional().describe('Trạng thái của space'),
  expand: z.array(z.string()).optional().default(['description']).describe('Các thuộc tính bổ sung cần lấy')
});

type GetSpacesParams = z.infer<typeof getSpacesSchema>;

interface GetSpacesResult {
  size: number;
  limit: number;
  start: number;
  spaces: Array<{
    id: string;
    key: string;
    name: string;
    type: string;
    status: string;
    description?: string;
    homepage?: {
      id: string;
      title: string;
    };
    url: string;
  }>;
}

// Hàm tạo cấu hình Atlassian từ biến môi trường
function getAtlassianConfigFromEnv(): AtlassianConfig | null {
  const siteName = process.env.ATLASSIAN_SITE_NAME;
  const email = process.env.ATLASSIAN_USER_EMAIL;
  const apiToken = process.env.ATLASSIAN_API_TOKEN;
  
  if (!siteName || !email || !apiToken) {
    logger.error('Missing Atlassian credentials in environment variables');
    return null;
  }
  
  logger.info(`Creating Atlassian config from environment variables for site: ${siteName}`);
  
  return {
    baseUrl: `https://${siteName}`,
    apiToken: apiToken,
    email: email
  };
}

// Hàm xử lý chính để lấy danh sách spaces
export async function getSpacesHandler(
  params: GetSpacesParams,
  config: AtlassianConfig
): Promise<GetSpacesResult> {
  try {
    logger.info('Getting Confluence spaces');
    
    // Chuẩn bị tham số cho API call
    const queryParams: Record<string, string | number> = {
      limit: params.limit,
      expand: params.expand.join(',')
    };
    
    if (params.type) {
      queryParams.type = params.type;
    }
    
    if (params.status) {
      queryParams.status = params.status;
    }
    
    // Gọi Confluence API để lấy danh sách spaces
    const response = await callConfluenceApi<any>(
      config,
      '/space',
      'GET',
      null,
      queryParams
    );
    
    // Xử lý và trả về kết quả
    const spaces = response.results.map((space: any) => {
      const result: any = {
        id: space.id,
        key: space.key,
        name: space.name,
        type: space.type,
        status: space.status,
        url: `${config.baseUrl}/wiki/spaces/${space.key}`
      };
      
      // Thêm description nếu có
      if (space.description && space.description.plain) {
        result.description = space.description.plain.value;
      }
      
      // Thêm homepage nếu có
      if (space.homepage) {
        result.homepage = {
          id: space.homepage.id,
          title: space.homepage.title
        };
      }
      
      return result;
    });
    
    return {
      size: response.size,
      limit: response.limit,
      start: response.start,
      spaces
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error('Error getting Confluence spaces:', error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể lấy danh sách spaces: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerGetSpacesTool = (server: McpServer) => {
  server.tool(
    'getSpaces',
    'Lấy danh sách spaces trong Confluence',
    getSpacesSchema.shape,
    async (params: GetSpacesParams, context: any): Promise<McpResponse> => {
      try {
        // Lấy cấu hình từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          logger.error('Atlassian configuration not found in context');
          
          // Thử lấy cấu hình từ biến môi trường như fallback
          const envConfig = getAtlassianConfigFromEnv();
          
          if (!envConfig) {
            return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
          }
          
          logger.info('Using Atlassian configuration from environment variables as fallback');
          
          // Lấy danh sách spaces với cấu hình từ môi trường
          const result = await getSpacesHandler(params, envConfig);
          
          // Tạo chuỗi kết quả định dạng theo dạng text
          const formattedResult = [
            `Tìm thấy ${result.size} space(s)`,
            `Hiển thị từ ${result.start + 1} đến ${Math.min(result.start + result.spaces.length, result.size)}`,
            '',
            ...result.spaces.map(space => {
              const description = space.description ? `\n  Mô tả: ${space.description.substring(0, 100)}${space.description.length > 100 ? '...' : ''}` : '';
              const homepage = space.homepage ? `\n  Trang chủ: ${space.homepage.title} (ID: ${space.homepage.id})` : '';
              
              return [
                `${space.name} (${space.key})`,
                `  Loại: ${space.type} | Trạng thái: ${space.status}`,
                `  URL: ${space.url}`,
                description,
                homepage
              ].join('');
            })
          ].join('\n');
          
          return createTextResponse(formattedResult, result as unknown as Record<string, unknown>);
        }
        
        // Lấy danh sách spaces với cấu hình từ context
        const result = await getSpacesHandler(params, config);
        
        // Tạo chuỗi kết quả định dạng theo dạng text
        const formattedResult = [
          `Tìm thấy ${result.size} space(s)`,
          `Hiển thị từ ${result.start + 1} đến ${Math.min(result.start + result.spaces.length, result.size)}`,
          '',
          ...result.spaces.map(space => {
            const description = space.description ? `\n  Mô tả: ${space.description.substring(0, 100)}${space.description.length > 100 ? '...' : ''}` : '';
            const homepage = space.homepage ? `\n  Trang chủ: ${space.homepage.title} (ID: ${space.homepage.id})` : '';
            
            return [
              `${space.name} (${space.key})`,
              `  Loại: ${space.type} | Trạng thái: ${space.status}`,
              `  URL: ${space.url}`,
              description,
              homepage
            ].join('');
          })
        ].join('\n');
        
        return createTextResponse(formattedResult, result as unknown as Record<string, unknown>);
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Lỗi khi lấy danh sách spaces: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 