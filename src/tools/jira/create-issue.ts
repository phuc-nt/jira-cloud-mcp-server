import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createIssue } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { JiraIssueType } from '../../utils/jira-interfaces.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:createIssue');

// Schema cho tham số đầu vào
export const createIssueSchema = z.object({
  projectKey: z.string().describe('Key của project (ví dụ: PROJ)'),
  summary: z.string().describe('Tiêu đề của issue'),
  issueType: z.string().default('Task').describe('Loại issue (ví dụ: Bug, Task, Story)'),
  description: z.string().optional().describe('Mô tả của issue'),
  priority: z.string().optional().describe('Mức độ ưu tiên (ví dụ: High, Medium, Low)'),
  assignee: z.string().optional().describe('Username của người được gán'),
  labels: z.array(z.string()).optional().describe('Các nhãn gán cho issue')
});

type CreateIssueParams = z.infer<typeof createIssueSchema>;

interface CreateIssueResult {
  id: string;
  key: string;
  self: string;
  success: boolean;
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

// Hàm xử lý chính để tạo issue mới
export async function createIssueHandler(
  params: CreateIssueParams,
  config: AtlassianConfig
): Promise<CreateIssueResult> {
  try {
    logger.info(`Creating new issue in project: ${params.projectKey}`);
    
    // Xây dựng additionalFields từ các tham số tùy chọn
    const additionalFields: Record<string, any> = {};
    
    // Thêm priority nếu có
    if (params.priority) {
      additionalFields.priority = {
        name: params.priority
      };
    }
    
    // Thêm assignee nếu có
    if (params.assignee) {
      additionalFields.assignee = {
        name: params.assignee
      };
    }
    
    // Thêm labels nếu có
    if (params.labels && params.labels.length > 0) {
      additionalFields.labels = params.labels;
    }
    
    // Gọi hàm createIssue thay vì callJiraApi
    const newIssue = await createIssue(
      config,
      params.projectKey,
      params.summary,
      params.description,
      params.issueType,
      additionalFields
    );
    
    // Trả về kết quả
    return {
      id: newIssue.id,
      key: newIssue.key,
      self: newIssue.self,
      success: true
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error creating issue in project ${params.projectKey}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể tạo issue: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerCreateIssueTool = (server: McpServer) => {
  server.tool(
    'createIssue',
    'Tạo issue mới trong Jira',
    createIssueSchema.shape,
    async (params: CreateIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách lấy context)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        // Tạo issue mới
        const result = await createIssueHandler(params, config);
        
        // Tạo response theo chuẩn MCP
        return createTextResponse(
          `Đã tạo issue thành công: ${result.key}`,
          {
            id: result.id,
            key: result.key,
            self: result.self,
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
          `Lỗi khi tạo issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 