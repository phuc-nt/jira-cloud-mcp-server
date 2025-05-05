import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:createPage');

// Input parameter schema
export const createPageSchema = z.object({
  spaceKey: z.string().describe('Space key to create the page in (e.g., DEV, HR)'),
  title: z.string().describe('Title of the page'),
  content: z.string().describe('Content of the page (in Confluence storage/HTML format)'),
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
}

// Main handler to create a new page
export async function createPageHandler(
  params: CreatePageParams,
  config: AtlassianConfig
): Promise<CreatePageResult> {
  try {
    logger.info(`Creating new page "${params.title}" in space ${params.spaceKey}`);

    // Validate parentId nếu có
    if (params.parentId) {
      // Gọi API kiểm tra parentId có tồn tại và thuộc cùng space không
      try {
        const parentPage = await callConfluenceApi<any>(
          config,
          `/content/${params.parentId}?expand=space`,
          'GET'
        );
        if (!parentPage || !parentPage.space || parentPage.space.key !== params.spaceKey) {
          throw new ApiError(
            ApiErrorType.VALIDATION_ERROR,
            `Parent page not found or does not belong to space ${params.spaceKey}`,
            400
          );
        }
      } catch (err) {
        logger.error(`Parent page validation failed:`, err);
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          `Parent page not found or does not belong to space ${params.spaceKey}`,
          400
        );
      }
    }

    // Validate content storage format cơ bản (chỉ kiểm tra có tag XML hoặc <p>...)
    if (!params.content.trim().startsWith('<')) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        'Content must be in Confluence storage format (XML-like HTML). See documentation for details.',
        400
      );
    }

    // Prepare data for API call
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

    // If parentId is provided, set this page as a child
    if (params.parentId) {
      requestData.ancestors = [
        {
          id: params.parentId
        }
      ];
    }

    // Call Confluence API to create the page
    const response = await callConfluenceApi<any>(
      config,
      '/content',
      'POST',
      requestData
    );

    // Build result for the Tool
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
    // Cải thiện thông báo lỗi
    let message = `Failed to create page: ${error instanceof Error ? error.message : String(error)}`;
    if (message.includes('storage format')) {
      message += ' (Tip: Use storage format. You can get a sample by calling GET /rest/api/content/{pageId}?expand=body.storage)';
    }
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
    'Create a new page in Confluence',
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
          `Page "${result.title}" created successfully in space ${params.spaceKey}. URL: ${config.baseUrl}/wiki/spaces/${params.spaceKey}/pages/${result.id}/${encodeURIComponent(result.title.replace(/ /g, '+'))}`,
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
          `Error while creating page: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 