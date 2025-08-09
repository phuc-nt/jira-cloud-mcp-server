import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:updateEpic');

// Input schema for updateEpic tool
const UpdateEpicInputSchema = z.object({
  epicKey: z.string().describe('Epic key or ID (e.g., PROJ-123)'),
  name: z.string().optional().describe('Epic name'),
  summary: z.string().optional().describe('Epic summary'),
  color: z.object({
    key: z.string().describe('Color key (e.g., color_1, color_2, etc.)')
  }).optional().describe('Epic color'),
  done: z.boolean().optional().describe('Whether the Epic is done')
});

type UpdateEpicParams = z.infer<typeof UpdateEpicInputSchema>;

async function updateEpicImpl(params: UpdateEpicParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Updating Epic: ${params.epicKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    headers['Content-Type'] = 'application/json';
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    
    // Build update payload with only provided fields
    const updateData: any = {};
    if (params.name !== undefined) updateData.name = params.name;
    if (params.summary !== undefined) updateData.summary = params.summary;
    if (params.color !== undefined) updateData.color = params.color;
    if (params.done !== undefined) updateData.done = params.done;

    if (Object.keys(updateData).length === 0) {
      throw new ApiError(ApiErrorType.VALIDATION_ERROR, 'At least one field (name, summary, color, done) must be provided for update', 400);
    }
    
    // Call Jira Agile API to update Epic
    const url = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(params.epicKey)}`;
    
    const response = await fetch(url, { 
      method: 'POST',
      headers, 
      body: JSON.stringify(updateData),
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira Agile API error (update epic, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira Agile API error: ${response.status} ${responseText}`, response.status);
    }

    const updatedEpic = await response.json();
    
    logger.info(`Successfully updated Epic: ${params.epicKey}`);
    
    return {
      success: true,
      epic: {
        id: updatedEpic.id,
        key: params.epicKey,
        name: updatedEpic.name,
        summary: updatedEpic.summary,
        color: updatedEpic.color,
        done: updatedEpic.done,
        self: updatedEpic.self
      },
      updatedFields: Object.keys(updateData),
      message: `Epic ${params.epicKey} updated successfully`
    };

  } catch (error: any) {
    if (error instanceof ApiError) {
      throw error;
    }
    logger.error(`Error updating Epic ${params.epicKey}:`, error);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Failed to update Epic: ${error.message}`, 500);
  }
}

/**
 * Update Epic using Jira Agile API
 */
export const registerUpdateEpicTool = (server: any) => {
  server.tool(
    'updateEpic',
    'Update Epic using Jira Agile API with Epic-specific fields like color and done status',
    UpdateEpicInputSchema.shape,
    async (params: UpdateEpicParams, context: Record<string, any>) => {
      try {
        const result = await updateEpicImpl(params, context);
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
