import { z } from 'zod';
import { callConfluenceApi, adfToMarkdown } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Khởi tạo logger
const logger = Logger.getLogger('ConfluenceTools:getPage');

// Schema cho tham số đầu vào
export const getPageSchema = z.object({
  pageId: z.string().describe('ID của trang Confluence'),
  expand: z.array(z.string()).optional().default(['body.storage', 'version', 'space', 'ancestors', 'children.page', 'metadata.labels']).describe('Các thuộc tính bổ sung cần lấy')
});

type GetPageParams = z.infer<typeof getPageSchema>;

interface GetPageResult {
  id: string;
  type: string;
  status: string;
  title: string;
  spaceKey: string;
  spaceName: string;
  content: string;
  version: {
    number: number;
    createdAt: string;
    createdBy: string;
  };
  ancestors: Array<{
    id: string;
    title: string;
  }>;
  children: Array<{
    id: string;
    title: string;
  }>;
  labels: Array<{
    name: string;
  }>;
  _links: {
    webui: string;
    self: string;
  };
}

// Hàm xử lý chính để lấy thông tin chi tiết về trang
export async function getPageHandler(
  params: GetPageParams,
  config: AtlassianConfig
): Promise<GetPageResult> {
  try {
    logger.info(`Getting page information for page ID: ${params.pageId}`);
    
    // Chuẩn bị tham số cho API call
    const expandParam = params.expand.join(',');
    
    // Gọi Confluence API để lấy chi tiết trang
    const response = await callConfluenceApi<any>(
      config,
      `/content/${params.pageId}?expand=${expandParam}`,
      'GET'
    );
    
    // Chuyển đổi nội dung từ Confluence storage format sang Markdown
    let content = '';
    if (response.body && response.body.storage && response.body.storage.value) {
      content = response.body.storage.value;
      // Lưu ý: Confluence storage format là HTML-based, không phải ADF
      // Trong triển khai thực tế, có thể cần một parser HTML -> Markdown
      // Ở đây ta giả định rằng hàm adfToMarkdown có thể xử lý cả storage format
    }
    
    // Trích xuất danh sách ancestors nếu có
    const ancestors = response.ancestors 
      ? response.ancestors.map((ancestor: any) => ({
          id: ancestor.id,
          title: ancestor.title
        }))
      : [];
    
    // Trích xuất danh sách children nếu có
    const children = response.children && response.children.page 
      ? response.children.page.results.map((child: any) => ({
          id: child.id,
          title: child.title
        }))
      : [];
    
    // Trích xuất danh sách labels nếu có
    const labels = response.metadata && response.metadata.labels
      ? response.metadata.labels.results.map((label: any) => ({
          name: label.name
        }))
      : [];
    
    // Trả về dữ liệu đã xử lý
    return {
      id: response.id,
      type: response.type,
      status: response.status,
      title: response.title,
      spaceKey: response.space.key,
      spaceName: response.space.name,
      content: content,
      version: {
        number: response.version.number,
        createdAt: response.version.when,
        createdBy: response.version.by.displayName
      },
      ancestors,
      children,
      labels,
      _links: {
        webui: response._links.webui,
        self: response._links.self
      }
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    
    logger.error(`Error getting page ${params.pageId}:`, error);
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      `Không thể lấy thông tin trang: ${error instanceof Error ? error.message : String(error)}`,
      500
    );
  }
}

// Tạo và đăng ký tool với MCP Server
export const registerGetPageTool = (server: McpServer) => {
  server.tool(
    'getPage',
    'Lấy thông tin chi tiết về một trang trong Confluence',
    getPageSchema.shape,
    async (params: GetPageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Lấy cấu hình Atlassian từ context (cập nhật cách truy cập)
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Cấu hình Atlassian không hợp lệ hoặc không tìm thấy');
        }
        
        const result = await getPageHandler(params, config);
        
        // Tạo chuỗi kết quả định dạng theo dạng text
        const formattedResult = [
          `Tiêu đề: ${result.title}`,
          `Space: ${result.spaceName} (${result.spaceKey})`,
          `ID: ${result.id}`,
          `URL: ${config.baseUrl}/wiki${result._links.webui}`,
          `Version: ${result.version.number} (cập nhật bởi ${result.version.createdBy} lúc ${result.version.createdAt})`,
          `Trạng thái: ${result.status}`,
          '',
          result.ancestors.length > 0 ? 'Trang cha:' : '',
          ...result.ancestors.map(a => `- ${a.title} (ID: ${a.id})`),
          '',
          result.children.length > 0 ? 'Trang con:' : '',
          ...result.children.map(c => `- ${c.title} (ID: ${c.id})`),
          '',
          result.labels.length > 0 ? 'Nhãn:' : '',
          ...result.labels.map(l => `- ${l.name}`),
          '',
          'Nội dung trang:',
          '---',
          result.content
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
          `Lỗi khi lấy thông tin trang: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 