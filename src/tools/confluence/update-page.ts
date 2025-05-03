import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';

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

// Main handler to update a page
export async function updatePageHandler(
  params: UpdatePageParams,
  config: AtlassianConfig
): Promise<UpdatePageResult> {
  try {
    logger.info(`Updating page with ID: ${params.pageId}`);
    
    // Call API to get current page info
    const currentPage = await callConfluenceApi<any>(
      config,
      `/content/${params.pageId}?expand=body.storage,version`,
      'GET'
    );
    
    // Check version number
    if (currentPage.version.number !== params.version) {
      throw new ApiError(
        ApiErrorType.VALIDATION_ERROR,
        `Version conflict. The page has been updated to version ${currentPage.version.number}, you are using version ${params.version}`,
        409
      );
    }
    
    // Prepare data for API call
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
    
    // If no title, content, addLabels, or removeLabels, return error
    if (!params.title && !params.content && !params.addLabels?.length && !params.removeLabels?.length) {
      return {
        id: params.pageId,
        title: currentPage.title,
        version: currentPage.version.number,
        self: currentPage._links.self,
        webui: currentPage._links.webui,
        success: false,
        message: 'No information provided to update'
      };
    }
    
    // Call Confluence API to update the page
    const response = await callConfluenceApi<any>(
      config,
      `/content/${params.pageId}`,
      'PUT',
      requestData
    );
    
    // Handle labels if provided
    let labelsAdded: string[] = [];
    let labelsRemoved: string[] = [];
    
    // Add new labels if provided
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
    
    // Remove labels if provided
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
    
    // Build message based on actions performed
    const actions = [];
    if (params.title) actions.push('title');
    if (params.content) actions.push('content');
    if (labelsAdded.length > 0) actions.push('add label');
    if (labelsRemoved.length > 0) actions.push('remove label');
    
    const message = `Successfully updated page: ${actions.join(', ')}`;
    
    // Return result
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
      `Failed to update page: ${error instanceof Error ? error.message : String(error)}`,
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