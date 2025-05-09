import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { updateConfluencePageV2 } from '../../utils/atlassian-api.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:updatePage');

// Input parameter schema
export const updatePageSchema = z.object({
  pageId: z.string().describe('ID of the page to update'),
  title: z.string().optional().describe('New title of the page'),
  content: z.string().optional().describe('New content of the page (in storage/HTML format)'),
  version: z.number().describe('Current version number of the page (required to avoid conflicts)'),
  addLabels: z.array(z.string()).optional().describe('Labels to add to the page'),
  removeLabels: z.array(z.string()).optional().describe('Labels to remove from the page')
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

// Main handler to update a page (API v2)
export async function updatePageHandler(
  params: UpdatePageParams,
  config: AtlassianConfig
): Promise<UpdatePageResult> {
  try {
    logger.info(`Updating page (v2) with ID: ${params.pageId}`);
    // Lấy version hiện tại
    const baseUrl = config.baseUrl.endsWith('/wiki') ? config.baseUrl : `${config.baseUrl}/wiki`;
    const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
    const headers = {
      'Authorization': `Basic ${auth}`,
      'Content-Type': 'application/json',
      'Accept': 'application/json',
      'User-Agent': 'MCP-Atlassian-Server/1.0.0'
    };
    const url = `${baseUrl}/api/v2/pages/${encodeURIComponent(params.pageId)}`;
    const res = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    if (!res.ok) throw new Error(`Failed to get page info: ${params.pageId}`);
    const pageData = await res.json();
    let version = pageData.version.number;
    // Gọi helper updateConfluencePageV2
    const data = await updateConfluencePageV2(config, {
      pageId: params.pageId,
      title: params.title,
      content: params.content,
      version
    });
    return {
      id: data.id,
      title: data.title,
      version: data.version.number,
      self: data._links?.self || '',
      webui: data._links?.webui || '',
      success: true,
      message: 'Successfully updated page'
    };
  } catch (error) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error updating page (v2) with ID ${params.pageId}:`, error);
    let message = `Failed to update page: ${error instanceof Error ? error.message : String(error)}`;
    throw new ApiError(
      ApiErrorType.SERVER_ERROR,
      message,
      500
    );
  }
}

// Register the tool with MCP Server
export const registerUpdatePageTool = (server: McpServer) => {
  server.tool(
    'updatePage',
    'Update the content and information of a Confluence page',
    updatePageSchema.shape,
    async (params: UpdatePageParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Get Atlassian config from context
        const config = (context as any).atlassianConfig as AtlassianConfig;
        
        if (!config) {
          return createErrorResponse('Invalid or missing Atlassian configuration');
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
          `Error while updating page: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 