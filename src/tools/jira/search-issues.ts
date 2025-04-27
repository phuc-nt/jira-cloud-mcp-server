import { z } from 'zod';
import { searchIssues, adfToMarkdown } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { JiraIssue } from '../../utils/jira-interfaces.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTools:searchIssues');

// Schema cho tham số đầu vào
export const searchIssuesSchema = z.object({
  jql: z.string().describe('JQL query để tìm kiếm issues (ví dụ: project = PROJ AND status = "In Progress")'),
  maxResults: z.number().optional().default(10).describe('Số lượng kết quả tối đa'),
  fields: z.array(z.string()).optional().default(['summary', 'status', 'assignee', 'created', 'updated', 'issuetype']).describe('Các trường cần trả về')
});

type SearchIssuesParams = z.infer<typeof searchIssuesSchema>;

interface SearchIssuesResult {
  total: number;
  startAt: number;
  maxResults: number;
  issues: Array<{
    id: string;
    key: string;
    summary: string;
    status: string;
    issueType: string;
    assignee?: string;
    created?: string;
    updated?: string;
  }>;
}

// Hàm xử lý chính để tìm kiếm issues
export async function searchIssuesHandler(
  params: SearchIssuesParams,
  config: AtlassianConfig
): Promise<SearchIssuesResult> {
  try {
    logger.info(`Searching issues with JQL: ${params.jql}`);
    
    // Gọi hàm searchIssues từ atlassian-api.js
    const response = await searchIssues(
      config,
      params.jql,
      params.maxResults
    );
    
    // Xử lý và trả về kết quả
    const issues = response.issues.map((issue: JiraIssue) => ({
      id: issue.id,
      key: issue.key,
      summary: issue.fields.summary,
      status: issue.fields.status?.name || 'Unknown',
      issueType: issue.fields.issuetype.name,
      assignee: issue.fields.assignee ? issue.fields.assignee.displayName : undefined,
      created: issue.fields.created,
      updated: issue.fields.updated
    }));
    
    return {
      total: response.total,
      startAt: response.startAt,
      maxResults: response.maxResults,
      issues
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error searching issues with JQL: ${params.jql}`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể tìm kiếm issues: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerSearchIssuesTool = (server: McpServer) => {
  server.tool(
    'searchIssues',
    'Tìm kiếm issues trong Jira theo JQL (Jira Query Language)',
    searchIssuesSchema.shape,
    async (params: SearchIssuesParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await searchIssuesHandler(params, config);
        
        // Tạo chuỗi kết quả định dạng theo dạng text
        const formattedResult = [
          `Tìm thấy ${result.total} issue(s)`,
          `Hiển thị từ ${result.startAt + 1} đến ${Math.min(result.startAt + result.issues.length, result.total)}`,
          '',
          ...result.issues.map(issue => {
            return `${issue.key}: ${issue.summary}\n  Loại: ${issue.issueType} | Trạng thái: ${issue.status}${issue.assignee ? ` | Người được gán: ${issue.assignee}` : ''}`;
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
          `Lỗi khi tìm kiếm issues: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 