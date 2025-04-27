import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:addComment');

// Schema cho tham số đầu vào
export const addCommentSchema = z.object({
  pageId: z.string().describe('ID của trang cần thêm comment'),
  content: z.string().describe('Nội dung của comment (ở định dạng Confluence storage/HTML)')
});

type AddCommentParams = z.infer<typeof addCommentSchema>;

interface AddCommentResult {
  commentId: string;
  status: string;
}

// Hàm xử lý chính để thêm comment vào trang
export async function addCommentHandler(
  params: AddCommentParams,
  config: AtlassianConfig
): Promise<AddCommentResult> {
  try {
    logger.info(`Adding comment to page: ${params.pageId}`);
    
    // Chuẩn bị dữ liệu cho API call
    const requestData = {
      type: 'comment',
      container: {
        type: 'page',
        id: params.pageId
      },
      body: {
        storage: {
          value: params.content,
          representation: 'storage'
        }
      }
    };
    
    // Gọi Confluence API để thêm comment
    const response = await callConfluenceApi<any>(
      config,
      '/content',
      'POST',
      requestData
    );
    
    // Trả về kết quả
    return {
      commentId: response.id,
      status: response.status
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error adding comment to page ${params.pageId}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể thêm comment: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerAddCommentTool = (server: McpServer) => {
  server.tool(
    'addComment',
    'Thêm comment vào trang Confluence',
    addCommentSchema.shape,
    async (params: AddCommentParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await addCommentHandler(params, config);
        
        // Trả về kết quả theo định dạng MCP Response
        return createTextResponse(
          `Đã thêm comment thành công với ID: ${result.commentId}`,
          { commentId: result.commentId, status: result.status }
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
          `Lỗi khi thêm comment: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 