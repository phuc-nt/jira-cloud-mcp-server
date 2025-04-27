import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:createPage');

// Schema cho tham số đầu vào
export const createPageSchema = z.object({
  spaceKey: z.string().describe('Key của space để tạo trang (ví dụ: DEV, HR)'),
  title: z.string().describe('Tiêu đề của trang'),
  content: z.string().describe('Nội dung của trang (ở định dạng Confluence storage/HTML)'),
  parentId: z.string().optional().describe('ID của trang cha (nếu muốn tạo trang con)')
});

type CreatePageParams = z.infer<typeof createPageSchema>;

interface CreatePageResult {
  id: string;
  key: string;
  title: string;
  self: string;
  webui: string;
  success: boolean;
}

// Hàm xử lý chính để tạo trang mới
export async function createPageHandler(
  params: CreatePageParams,
  config: AtlassianConfig
): Promise<CreatePageResult> {
  try {
    logger.info(`Creating new page "${params.title}" in space ${params.spaceKey}`);
    
    // Chuẩn bị dữ liệu cho API call
    const requestData: any = {
      type: 'page',
      title: params.title,
      space: {
        key: params.spaceKey
      },
      body: {
        storage: {
          value: params.content,
          representation: 'storage'
        }
      }
    };
    
    // Nếu có parentId, thêm trang này như là con của trang đó
    if (params.parentId) {
      requestData.ancestors = [
        {
          id: params.parentId
        }
      ];
    }
    
    // Gọi Confluence API để tạo trang
    const response = await callConfluenceApi<any>(
      config,
      '/content',
      'POST',
      requestData
    );
    
    // Tạo kết quả trả về cho Tool
    return {
      id: response.id,
      key: response.key || '',
      title: response.title,
      self: response._links.self,
      webui: response._links.webui,
      success: true
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error creating page in space ${params.spaceKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể tạo trang: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerCreatePageTool = (server: McpServer) => {
  server.tool(
    'createPage',
    'Tạo trang mới trong Confluence',
    createPageSchema.shape,
    async (params: CreatePageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await createPageHandler(params, config);
        
        return createTextResponse(
          `Đã tạo trang "${result.title}" thành công trong space ${params.spaceKey}. URL: ${config.baseUrl}/wiki/spaces/${params.spaceKey}/pages/${result.id}/${encodeURIComponent(result.title.replace(/ /g, '+'))}`,
          {
            id: result.id,
            title: result.title,
            spaceKey: params.spaceKey,
            url: `${config.baseUrl}/wiki/spaces/${params.spaceKey}/pages/${result.id}/${encodeURIComponent(result.title.replace(/ /g, '+'))}`,
            success: result.success
          }
        );
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Lỗi khi tạo trang: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 