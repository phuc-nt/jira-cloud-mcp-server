import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getEpic');

// Input schema for getEpic tool
const GetEpicInputSchema = z.object({
  epicKey: z.string().describe('Epic key or ID (e.g., PROJ-123)'),
});

type GetEpicParams = z.infer<typeof GetEpicInputSchema>;

async function getEpicImpl(params: GetEpicParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting Epic details for: ${params.epicKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Call Jira Agile API to get Epic details
    const url = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(params.epicKey)}`;
    
    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (get epic, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const epic = await response.json();
    
    if (!epic || !epic.id) {
      throw new ApiError(ApiErrorType.NOT_FOUND_ERROR, `Epic not found: ${params.epicKey}`, 404);
    }

    logger.info(`Successfully retrieved Epic: ${params.epicKey}`);
    
    return {
      success: true,
      epic: {
        id: epic.id,
        key: params.epicKey,
        name: epic.name,
        summary: epic.summary,
        color: epic.color,
        done: epic.done,
        self: epic.self
      },
      message: `Epic ${params.epicKey} retrieved successfully`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error getting Epic ${params.epicKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to get Epic: ${error.message}`, 500);
  }
}

/**
 * Get Epic details using Jira Agile API
 */
export const registerGetEpicTool = (server: any) => {
  server.tool(
    'getEpic',
    'Get Epic details using Jira Agile API with Epic-specific fields like color and done status',
    GetEpicInputSchema.shape,
    async (params: GetEpicParams, context: Record<string, any>) => {
      try {
        const result = await getEpicImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error),
                epicKey: params.epicKey
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};
