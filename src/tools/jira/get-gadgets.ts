import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getGadgets');

// Input parameter schema
export const getGadgetsSchema = z.object({});

type GetGadgetsParams = z.infer<typeof getGadgetsSchema>;

async function getGadgetsImpl(params: GetGadgetsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info('Getting available Jira gadgets');

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Get available gadgets for dashboards
    const url = `${baseUrl}/rest/api/3/dashboard/gadgets`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get gadgets, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const result = await response.json();
    
    // Format gadgets response
    const formattedGadgets = result.gadgets?.map((gadget: any) => ({
      key: gadget.key,
      title: gadget.title,
      description: gadget.description,
      thumbnailUrl: gadget.thumbnailUrl,
      configurable: gadget.configurable,
      singleton: gadget.singleton,
      gadgetType: gadget.gadgetType
    })) || [];

    return {
      gadgets: formattedGadgets,
      total: formattedGadgets.length,
      success: true
    };

  } catch (error) {
    logger.error('Error getting gadgets:', error);
    throw error;
  }
}

export const registerGetJiraGadgetsTool = (server: McpServer) => {
  server.tool(
    'getJiraGadgets',
    'Get list of all available Jira gadgets for dashboard',
    getGadgetsSchema.shape,
    async (params: GetGadgetsParams, context: Record<string, any>) => {
      try {
        const result = await getGadgetsImpl(params, context);
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
                error: error instanceof Error ? error.message : String(error) 
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};