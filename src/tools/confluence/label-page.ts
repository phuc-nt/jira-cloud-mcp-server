import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { addLabelsToPage, removeLabelsFromPage } from '../../utils/atlassian-api.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:labelPage');

// Input parameter schema for adding labels
export const addLabelsSchema = z.object({
  pageId: z.string().describe('Page ID'),
  labels: z.array(z.string()).describe('Labels to add')
});

// Input parameter schema for removing labels
export const removeLabelsSchema = z.object({
  pageId: z.string().describe('Page ID'),
  labels: z.array(z.string()).describe('Labels to remove')
});

type AddLabelsParams = z.infer<typeof addLabelsSchema>;
type RemoveLabelsParams = z.infer<typeof removeLabelsSchema>;

interface LabelResult {
  success: boolean;
  labelsCount: number;
}

// Main handler to add labels to a page
export async function addLabelsHandler(
  params: AddLabelsParams,
  config: any
): Promise<LabelResult> {
  try {
    logger.info(`Adding ${params.labels.length} labels to page ${params.pageId}`);
    const result = await addLabelsToPage(config, params.pageId, params.labels);
    return {
      success: true,
      labelsCount: result.labelsCount || params.labels.length
    };
  } catch (error) {
    logger.error(`Error adding labels to page ${params.pageId}:`, error);
    throw error;
  }
}

// Main handler to remove labels from a page
export async function removeLabelsHandler(
  params: RemoveLabelsParams,
  config: any
): Promise<LabelResult> {
  try {
    logger.info(`Removing ${params.labels.length} labels from page ${params.pageId}`);
    const result = await removeLabelsFromPage(config, params.pageId, params.labels);
    return {
      success: true,
      labelsCount: result.labelsCount || params.labels.length
    };
  } catch (error) {
    logger.error(`Error removing labels from page ${params.pageId}:`, error);
    throw error;
  }
}

// Register the add labels tool with MCP Server
export const registerAddLabelsTool = (server: McpServer) => {
  server.tool(
    'addLabelsToPage',
    'Add labels to a Confluence page',
    addLabelsSchema.shape,
    async (params: AddLabelsParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Add labels
        const result = await addLabelsHandler(params, context.config);
        
        // Return MCP-compliant response
        return createTextResponse(
          `Added ${result.labelsCount} labels to page ${params.pageId} successfully`,
          {
            success: result.success,
            labelsCount: result.labelsCount,
            pageId: params.pageId
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while adding labels: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
};

// Register the remove labels tool with MCP Server
export const registerRemoveLabelsTool = (server: McpServer) => {
  server.tool(
    'removeLabelsFromPage',
    'Remove labels from a Confluence page',
    removeLabelsSchema.shape,
    async (params: RemoveLabelsParams, context: Record<string, any>): Promise<McpResponse> => {
      try {
        // Remove labels
        const result = await removeLabelsHandler(params, context.config);
        
        // Return MCP-compliant response
        return createTextResponse(
          `Removed ${result.labelsCount} labels from page ${params.pageId} successfully`,
          {
            success: result.success,
            labelsCount: result.labelsCount,
            pageId: params.pageId
          }
        );
      } catch (error) {
        return createErrorResponse(
          `Error while removing labels: ${error instanceof Error ? error.message : String(error)}`
        );
      }
    }
  );
}; 