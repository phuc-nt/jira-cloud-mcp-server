import { z } from 'zod';
import { AtlassianConfig, updateIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:updateIssue');

// Schema cho tham số đầu vào
export const updateIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue cần cập nhật (ví dụ: PROJ-123)'),
  summary: z.string().optional().describe('Tiêu đề mới của issue'),
  description: z.string().optional().describe('Mô tả mới của issue'),
  priority: z.string().optional().describe('Mức độ ưu tiên mới (ví dụ: High, Medium, Low)'),
  labels: z.array(z.string()).optional().describe('Các nhãn mới gán cho issue'),
  customFields: z.record(z.any()).optional().describe('Các trường tùy chỉnh cần cập nhật')
});

type UpdateIssueParams = z.infer<typeof updateIssueSchema>;

interface UpdateIssueResult {
  issueIdOrKey: string;
  success: boolean;
  message: string;
}

// Hàm tạo Atlassian Document Format (ADF) từ text đơn giản
function textToAdf(text: string) {
  return {
    version: 1,
    type: 'doc',
    content: [
      {
        type: 'paragraph',
        content: [
          {
            type: 'text',
            text: text
          }
        ]
      }
    ]
  };
}

// Hàm xử lý chính để cập nhật issue
export async function updateIssueHandler(
  params: UpdateIssueParams,
  config: AtlassianConfig
): Promise<UpdateIssueResult> {
  try {
    logger.info(`Updating issue: ${params.issueIdOrKey}`);
    
    // Chuẩn bị dữ liệu cho API call
    const fields: Record<string, any> = {};
    
    // Thêm các trường cần cập nhật vào fields
    if (params.summary) {
      fields.summary = params.summary;
    }
    
    if (params.description) {
      fields.description = textToAdf(params.description);
    }
    
    if (params.priority) {
      fields.priority = {
        name: params.priority
      };
    }
    
    if (params.labels) {
      fields.labels = params.labels;
    }
    
    // Thêm các trường tùy chỉnh nếu có
    if (params.customFields) {
      Object.entries(params.customFields).forEach(([key, value]) => {
        fields[key] = value;
      });
    }
    
    // Kiểm tra xem có trường nào cần cập nhật không
    if (Object.keys(fields).length === 0) {
      return {
        issueIdOrKey: params.issueIdOrKey,
        success: false,
        message: 'Không có trường nào được cung cấp để cập nhật'
      };
    }
    
    // Gọi hàm updateIssue thay vì callJiraApi
    const result = await updateIssue(
      config,
      params.issueIdOrKey,
      fields
    );
    
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: result.success,
      message: result.message
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error updating issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể cập nhật issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerUpdateIssueTool = (server: McpServer) => {
  server.tool(
    'updateIssue',
    'Cập nhật thông tin của một issue trong Jira',
    updateIssueSchema.shape,
    async (params: UpdateIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (sử dụng cách truy cập mới)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await updateIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
            success: result.success,
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
          `Lỗi khi cập nhật issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 