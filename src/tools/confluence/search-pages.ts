import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:searchPages');

// Schema cho tham số đầu vào
export const searchPagesSchema = z.object({
  cql: z.string().describe('CQL query để tìm kiếm trang (ví dụ: space = "DEV" AND title ~ "API")'),
  limit: z.number().optional().default(10).describe('Số lượng kết quả tối đa'),
  expand: z.array(z.string()).optional().default(['space']).describe('Các thuộc tính bổ sung cần lấy')
});

type SearchPagesParams = z.infer<typeof searchPagesSchema>;

interface SearchPagesResult {
  total: number;
  start: number;
  limit: number;
  pages: Array<{
    id: string;
    title: string;
    type: string;
    spaceKey: string;
    spaceName: string;
    url: string;
    lastUpdated: string;
  }>;
}

// Hàm xử lý chính để tìm kiếm trang
export async function searchPagesHandler(
  params: SearchPagesParams,
  config: AtlassianConfig
): Promise<SearchPagesResult> {
  try {
    logger.info(`Searching pages with CQL: ${params.cql}`);
    
    // Chuẩn bị tham số cho API call
    const queryParams = {
      cql: params.cql,
      limit: params.limit,
      expand: params.expand.join(',')
    };
    
    // Gọi Confluence API để tìm kiếm trang
    const response = await callConfluenceApi<any>(
      config,
      '/content/search',
      'GET',
      null,
      queryParams
    );
    
    // Xử lý và trả về kết quả
    const pages = response.results.map((page: any) => ({
      id: page.id,
      title: page.title,
      type: page.type,
      spaceKey: page.space?.key || '',
      spaceName: page.space?.name || '',
      url: `${config.baseUrl}/wiki${page._links.webui}`,
      lastUpdated: page.history?.lastUpdated?.when || ''
    }));
    
    return {
      total: response.totalSize || response.size,
      start: response.start,
      limit: response.limit,
      pages
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error searching pages with CQL: ${params.cql}`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể tìm kiếm trang: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerSearchPagesTool = (server: McpServer) => {
  server.tool(
    'searchPages',
    'Tìm kiếm trang trong Confluence theo CQL (Confluence Query Language)',
    searchPagesSchema.shape,
    async (params: SearchPagesParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await searchPagesHandler(params, config);
        
        // Tạo chuỗi kết quả định dạng theo dạng text
        const formattedResult = [
          `Tìm thấy ${result.total} trang`,
          `Hiển thị từ ${result.start + 1} đến ${Math.min(result.start + result.pages.length, result.total)}`,
          '',
          ...result.pages.map(page => {
            return [
              `${page.title} (ID: ${page.id})`,
              `  Space: ${page.spaceName} (${page.spaceKey})`,
              `  Loại: ${page.type}`,
              page.lastUpdated ? `  Cập nhật lần cuối: ${page.lastUpdated}` : '',
              `  URL: ${page.url}`
            ].filter(line => line).join('\n');
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
          `Lỗi khi tìm kiếm trang: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 