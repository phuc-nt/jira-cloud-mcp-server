import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:updatePage');

// Schema cho tham số đầu vào
export const updatePageSchema = z.object({
  pageId: z.string().describe('ID của trang cần cập nhật'),
  title: z.string().optional().describe('Tiêu đề mới của trang'),
  content: z.string().optional().describe('Nội dung mới của trang (ở định dạng storage/HTML)'),
  version: z.number().describe('Số phiên bản hiện tại của trang (cần thiết để tránh xung đột)'),
  addLabels: z.array(z.string()).optional().describe('Các nhãn mới cần thêm vào trang'),
  removeLabels: z.array(z.string()).optional().describe('Các nhãn cần xóa khỏi trang')
});

type UpdatePageParams = z.infer<typeof updatePageSchema>;

interface UpdatePageResult {
  id: string;
  title: string;
  version: number;
  self: string;
  webui: string;
  success: boolean;
  message: string;
  labelsAdded?: string[];
  labelsRemoved?: string[];
}

// Hàm xử lý chính để cập nhật trang
export async function updatePageHandler(
  params: UpdatePageParams,
  config: AtlassianConfig
): Promise<UpdatePageResult> {
  try {
    logger.info(`Updating page with ID: ${params.pageId}`);
    
    // Gọi API để lấy thông tin hiện tại của trang
    const currentPage = await callConfluenceApi<any>(
      config,
      `/content/${params.pageId}?expand=body.storage,version`,
      'GET'
    );
    
    // Kiểm tra version số
    if (currentPage.version.number !== params.version) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Xung đột phiên bản. Trang đã được cập nhật lên phiên bản ${currentPage.version.number}, bạn đang sử dụng phiên bản ${params.version}`,
        409
      );
    }
    
    // Chuẩn bị dữ liệu cho API call
    const requestData: any = {
      type: 'page',
      title: params.title || currentPage.title,
      body: {
        storage: {
          value: params.content || currentPage.body.storage.value,
          representation: 'storage'
        }
      },
      version: {
        number: params.version + 1
      }
    };
    
    // Nếu không có cả title và content, trả về lỗi
    if (!params.title && !params.content && !params.addLabels?.length && !params.removeLabels?.length) {
      return {
        id: params.pageId,
        title: currentPage.title,
        version: currentPage.version.number,
        self: currentPage._links.self,
        webui: currentPage._links.webui,
        success: false,
        message: 'Không có thông tin nào được cung cấp để cập nhật'
      };
    }
    
    // Gọi Confluence API để cập nhật trang
    const response = await callConfluenceApi<any>(
      config,
      `/content/${params.pageId}`,
      'PUT',
      requestData
    );
    
    // Xử lý nhãn nếu có
    let labelsAdded: string[] = [];
    let labelsRemoved: string[] = [];
    
    // Thêm nhãn mới nếu có
    if (params.addLabels && params.addLabels.length > 0) {
      const labelsData = params.addLabels.map(label => ({ name: label }));
      
      await callConfluenceApi(
        config,
        `/content/${params.pageId}/label`,
        'POST',
        labelsData
      );
      
      labelsAdded = params.addLabels;
    }
    
    // Xóa nhãn nếu có
    if (params.removeLabels && params.removeLabels.length > 0) {
      for (const label of params.removeLabels) {
        await callConfluenceApi(
          config,
          `/content/${params.pageId}/label?name=${encodeURIComponent(label)}`,
          'DELETE'
        );
      }
      
      labelsRemoved = params.removeLabels;
    }
    
    // Tạo message dựa trên các thao tác đã thực hiện
    const actions = [];
    if (params.title) actions.push('tiêu đề');
    if (params.content) actions.push('nội dung');
    if (labelsAdded.length > 0) actions.push('thêm nhãn');
    if (labelsRemoved.length > 0) actions.push('xóa nhãn');
    
    const message = `Đã cập nhật ${actions.join(', ')} của trang thành công`;
    
    // Trả về kết quả
    const result: UpdatePageResult = {
      id: response.id,
      title: response.title,
      version: response.version.number,
      self: response._links.self,
      webui: response._links.webui,
      success: true,
      message: message
    };
    
    if (labelsAdded.length > 0) {
      result.labelsAdded = labelsAdded;
    }
    
    if (labelsRemoved.length > 0) {
      result.labelsRemoved = labelsRemoved;
    }
    
    return result;
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error updating page ${params.pageId}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể cập nhật trang: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerUpdatePageTool = (server: McpServer) => {
  server.tool(
    'updatePage',
    'Cập nhật nội dung và thông tin của một trang trong Confluence',
    updatePageSchema.shape,
    async (params: UpdatePageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await updatePageHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            id: result.id,
            title: result.title,
            version: result.version,
            success: result.success,
            url: `${config.baseUrl}/wiki${result.webui}`,
            labelsAdded: result.labelsAdded,
            labelsRemoved: result.labelsRemoved,
            message: result.message
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
          `Lỗi khi cập nhật trang: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 