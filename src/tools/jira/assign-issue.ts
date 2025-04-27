import { z } from 'zod';
import { AtlassianConfig, assignIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:assignIssue');

// Schema cho tham số đầu vào
export const assignIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue (ví dụ: PROJ-123)'),
  accountId: z.string().optional().describe('Account ID của người được gán (để trống để bỏ gán)')
});

type AssignIssueParams = z.infer<typeof assignIssueSchema>;

interface AssignIssueResult {
  issueIdOrKey: string;
  success: boolean;
  assignee: string | null;
  message: string;
}

// Hàm xử lý chính để gán issue
export async function assignIssueHandler(
  params: AssignIssueParams,
  config: AtlassianConfig
): Promise<AssignIssueResult> {
  try {
    logger.info(`Assigning issue ${params.issueIdOrKey} to ${params.accountId || 'no one'}`);
    
    // Gọi hàm assignIssue thay vì callJiraApi
    const result = await assignIssue(
      config,
      params.issueIdOrKey,
      params.accountId || null
    );
    
    // Trả về kết quả
    return {
      issueIdOrKey: params.issueIdOrKey,
      success: result.success,
      assignee: params.accountId || null,
      message: params.accountId 
        ? `Đã gán issue ${params.issueIdOrKey} cho người dùng có account ID: ${params.accountId}`
        : `Đã bỏ gán issue ${params.issueIdOrKey}`
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error assigning issue ${params.issueIdOrKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể gán issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerAssignIssueTool = (server: McpServer) => {
  server.tool(
    'assignIssue',
    'Gán issue trong Jira cho một người dùng',
    assignIssueSchema.shape,
    async (params: AssignIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await assignIssueHandler(params, config);
        
        return createTextResponse(
          result.message,
          {
            issueIdOrKey: result.issueIdOrKey,
            assignee: result.assignee,
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
          `Lỗi khi gán issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 