import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { createConfluencePageV2 } from '../../utils/confluence-tool-api.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:createPage');

// Input parameter schema
export const createPageSchema = z.object({
  spaceId: z.string().describe('ID số của space muốn tạo page (bắt buộc, lấy từ API v2, không phải key như TX, DEV, ...)'),
  title: z.string().describe('Title of the page'),
  content: z.string().describe(`Content của page (bắt buộc, chỉ hỗ trợ Confluence storage format - XML-like HTML).

- KHÔNG hỗ trợ plain text hoặc markdown (nếu truyền sẽ báo lỗi).
- HỖ TRỢ các thẻ HTML dạng XML-like, macro Confluence (<ac:structured-macro>, <ac:rich-text-body>, ...), bảng, panel, info, warning, v.v. nếu đúng storage format.
- Nội dung phải tuân thủ đúng chuẩn storage format của Confluence.

Ví dụ hợp lệ:
- <p>Đây là đoạn văn bản</p>
- <ac:structured-macro ac:name="info"><ac:rich-text-body>Thông tin</ac:rich-text-body></ac:structured-macro>
`),
  parentId: z.string().optional().describe('ID of the parent page (if creating a child page)')
});

type CreatePageParams = z.infer<typeof createPageSchema>;

interface CreatePageResult {
  id: string;
  key: string;
  title: string;
  self: string;
  webui: string;
  success: boolean;
  spaceId?: string;
}

// Main handler to create a new page (API v2)
export async function createPageHandler(
  params: CreatePageParams,
  config: AtlassianConfig
): Promise<CreatePageResult> {
  try {
    logger.info(`Creating new page (v2) "${params.title}" in spaceId ${params.spaceId}`);
    const data = await createConfluencePageV2(config, {
      spaceId: params.spaceId,
      title: params.title,
      content: params.content,
      parentId: params.parentId
    });
    return {
      id: data.id,
      key: data.key || '',
      title: data.title,
      self: data._links.self,
      webui: data._links.webui,
      success: true,
      spaceId: params.spaceId
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error creating page (v2) in spaceId ${params.spaceId}:`, error);
    let message = `Failed to create page: ${error instanceof Error ? error.message : String(error)}`;
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      message,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerCreatePageTool = (server: McpServer) => {
  server.tool(
    'createPage',
    'Create a new page in Confluence (API v2, chỉ hỗ trợ spaceId)',
    createPageSchema.shape,
    async (params: CreatePageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
        }
        
        const result = await createPageHandler(params, config);
        
        return createTextResponse(
          `Page created successfully!\n- ID: ${result.id}\n- Title: ${result.title}\n- SpaceId: ${result.spaceId}\n- Success: ${result.success}`,
          {
            id: result.id,
            title: result.title,
            spaceId: result.spaceId,
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
          `Error while creating page: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 