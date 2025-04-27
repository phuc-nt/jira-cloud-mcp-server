import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { AtlassianConfig, getIssue, adfToMarkdown } from '../../utils/atlassian-api.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { JiraIssue, JiraComment, JiraTransition } from '../../utils/jira-interfaces.js';

// Khởi tạo logger
const logger = Logger.getLogger('JiraTool:GetIssue');

// Schema cho tham số đầu vào
export const getIssueSchema = z.object({
  issueIdOrKey: z.string().describe('ID hoặc key của issue (ví dụ: PROJ-123)'),
});

// Trích xuất kiểu dữ liệu từ schema
export type GetIssueParams = z.infer<typeof getIssueSchema>;

interface GetIssueResult {
  id: string;
  key: string;
  summary: string;
  description: string;
  status: string;
  issueType: string;
  priority: string;
  assignee: string;
  reporter: string;
  created: string;
  updated: string;
  labels: string[];
  comments: Array<{
    id: string;
    author: string;
    created: string;
    content: string;
  }>;
  availableTransitions?: Array<{
    id: string;
    name: string;
  }>;
}

// Khai báo bổ sung thuộc tính transitions cho JiraIssue nếu có
interface JiraIssueWithTransitions extends JiraIssue {
  transitions?: JiraTransition[];
}

/**
 * Xử lý logic lấy thông tin issue từ Jira
 * @param params Tham số đầu vào (issueIdOrKey)
 * @param config Cấu hình Atlassian
 * @returns Dữ liệu về issue
 */
async function getIssueHandler(params: GetIssueParams, config: AtlassianConfig): Promise<any> {
  logger.info(`Getting issue: ${params.issueIdOrKey}`);
  
  try {
    // Sử dụng hàm getIssue trực tiếp từ utils thay vì callJiraApi
    const issue = await getIssue(config, params.issueIdOrKey);
    
    // Chuyển đổi mô tả từ ADF sang Markdown
    let description = '';
    if (issue.fields?.description) {
      description = adfToMarkdown(issue.fields.description);
    }
    
    // Định dạng kết quả
    const result = {
      key: issue.key,
      id: issue.id,
      summary: issue.fields?.summary || 'No summary',
      issueType: issue.fields?.issuetype?.name || 'Unknown',
      status: issue.fields?.status?.name || 'Unknown',
      priority: issue.fields?.priority?.name || 'Not set',
      assignee: issue.fields?.assignee?.displayName || 'Unassigned',
      reporter: issue.fields?.reporter?.displayName || 'Unknown',
      created: issue.fields?.created ? new Date(issue.fields.created).toLocaleString() : 'Unknown',
      updated: issue.fields?.updated ? new Date(issue.fields.updated).toLocaleString() : 'Unknown',
      description: description || 'No description provided.'
    };
    
    // Định dạng text output
    const textOutput = `
# ${result.summary}

**Key**: ${result.key}
**Type**: ${result.issueType}
**Status**: ${result.status}
**Priority**: ${result.priority}
**Assignee**: ${result.assignee}
**Reporter**: ${result.reporter}
**Created**: ${result.created}
**Updated**: ${result.updated}

## Description
${result.description}
`;

    return { textOutput, result };
  } catch (error) {
    // Re-throw any ApiError 
    if (error instanceof ApiError) {
      throw error;
    }
    
    // Xử lý lỗi khác
    logger.error(`Error in getIssueHandler:`, error);
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Lỗi khi lấy thông tin issue: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerGetIssueTool = (server: McpServer) => {
  server.tool(
    'getIssue',
    'Lấy thông tin chi tiết về một issue trong Jira',
    getIssueSchema.shape,
    async (params: GetIssueParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const { textOutput, result } = await getIssueHandler(params, config);
        
        return createTextResponse(textOutput, result);
      } catch (error) {
        if (error instanceof ApiError) {
          return createErrorResponse(error.message, {
            code: error.code,
            statusCode: error.statusCode,
            type: error.type
          });
        }
        
        return createErrorResponse(
          `Lỗi khi lấy thông tin issue: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 