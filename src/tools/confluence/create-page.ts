import { z } from 'zod';
import { callConfluenceApi } from '../../utils/atlassian-api-base.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpResponse, createTextResponse, createErrorResponse } from '../../utils/mcp-response.js';
import { createConfluencePageV2 } from '../../utils/confluence-tool-api.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('ConfluenceTools:createPage');

// Input parameter schema
export const createPageSchema = z.object({
  spaceId: z.string().describe('Space ID (required, must be the numeric ID from API v2, NOT the key like TX, DEV, ...)'),
  title: z.string().describe('Title of the page (required)'),
  content: z.string().describe(`Content of the page (required, must be in Confluence storage format - XML-like HTML).

- Plain text or markdown is NOT supported (will throw error).
- Only XML-like HTML tags, Confluence macros (<ac:structured-macro>, <ac:rich-text-body>, ...), tables, panels, info, warning, etc. are supported if valid storage format.
- Content MUST strictly follow Confluence storage format.

Valid examples:
- <p>This is a paragraph</p>
- <ac:structured-macro ac:name="info"><ac:rich-text-body>Information</ac:rich-text-body></ac:structured-macro>
`),
  parentId: z.string().describe('Parent page ID (required, must specify the parent page to create a child page)')
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
    async (params: CreatePageParams, context: Record<string, any>) => {
      try {
        const config = context?.atlassianConfig ?? Config.getAtlassianConfigFromEnv();
        if (!config) {
          return {
            content: [
              { type: 'text', text: 'Invalid or missing Atlassian configuration' }
            ],
            isError: true
          };
        }
        const result = await createPageHandler(params, config);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: true,
                message: `Page created successfully!`,
                id: result.id,
                title: result.title,
                spaceId: result.spaceId
              })
            }
          ]
        };
      } catch (error) {
        if (error instanceof ApiError) {
          return {
            content: [
              {
                type: 'text',
                text: JSON.stringify({
                  success: false,
                  message: error.message,
                  code: error.code,
                  statusCode: error.statusCode,
                  type: error.type
                })
              }
            ],
            isError: true
          };
        }
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({
                success: false,
                message: `Error while creating page: ${error instanceof Error ? error.message : String(error)}`
              })
            }
          ],
          isError: true
        };
      }
    }
  );
}; 