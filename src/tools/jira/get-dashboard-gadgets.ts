import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getDashboardGadgets');

// Input parameter schema
export const getDashboardGadgetsSchema = z.object({
  dashboardId: z.union([z.string(), z.number()]).describe('Dashboard ID'),
  moduleKey: z.string().optional().describe('Filter gadgets by module key'),
  uri: z.string().optional().describe('Filter gadgets by URI'),
  gadgetId: z.union([z.string(), z.number()]).optional().describe('Get specific gadget by ID')
});

type GetDashboardGadgetsParams = z.infer<typeof getDashboardGadgetsSchema>;

async function getDashboardGadgetsImpl(params: GetDashboardGadgetsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting gadgets for dashboard ID: ${params.dashboardId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build URL - if gadgetId is specified, get specific gadget, otherwise get all gadgets
    let url: string;
    if (params.gadgetId) {
      url = `${baseUrl}/rest/api/3/dashboard/${encodeURIComponent(params.dashboardId.toString())}/gadget/${encodeURIComponent(params.gadgetId.toString())}`;
    } else {
      // Build query parameters for filtering
      const queryParams = new URLSearchParams();
      if (params.moduleKey) queryParams.append('moduleKey', params.moduleKey);
      if (params.uri) queryParams.append('uri', params.uri);

      url = `${baseUrl}/rest/api/3/dashboard/${encodeURIComponent(params.dashboardId.toString())}/gadget`;
      if (queryParams.toString()) {
        url += `?${queryParams.toString()}`;
      }
    }

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get dashboard gadgets, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }

    const data = await response.json();
    
    // Handle both single gadget and gadgets array response
    const gadgetsData = params.gadgetId ? [data] : (data.gadgets || []);
    
    // Format gadgets information
    const gadgets = gadgetsData.map((gadget: any) => ({
      id: gadget.id,
      title: gadget.title,
      color: gadget.color,
      position: gadget.position ? {
        column: gadget.position.column,
        row: gadget.position.row
      } : null,
      moduleKey: gadget.moduleKey,
      uri: gadget.uri,
      // Gadget properties and configuration
      properties: gadget.properties ? Object.entries(gadget.properties).map(([key, value]) => ({
        key,
        value: value
      })) : [],
      // Additional gadget metadata
      ignoreUriAndModuleKeyValidation: gadget.ignoreUriAndModuleKeyValidation,
      // Dashboard reference
      dashboardId: params.dashboardId
    }));

    // Group gadgets by type/module for analysis
    const gadgetAnalysis = {
      totalGadgets: gadgets.length,
      gadgetsByType: gadgets.reduce((acc: Record<string, number>, gadget: any) => {
        const type = gadget.moduleKey || 'unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {}),
      gadgetsByColumn: gadgets.reduce((acc: Record<string, number>, gadget: any) => {
        const column = gadget.position?.column?.toString() || 'unknown';
        acc[column] = (acc[column] || 0) + 1;
        return acc;
      }, {}),
      maxRow: Math.max(...gadgets.map((g: any) => g.position?.row || 0), 0),
      maxColumn: Math.max(...gadgets.map((g: any) => g.position?.column || 0), 0),
      uniqueModuleKeys: [...new Set(gadgets.map((g: any) => g.moduleKey).filter(Boolean))]
    };

    return {
      dashboardId: params.dashboardId,
      gadgets,
      analysis: gadgetAnalysis,
      filters: {
        moduleKey: params.moduleKey,
        uri: params.uri,
        specificGadgetId: params.gadgetId
      },
      success: true
    };

  } catch (error) {
    logger.error('Error getting dashboard gadgets:', error);
    throw error;
  }
}

export const registerGetDashboardGadgetsTool = (server: McpServer) => {
  server.tool(
    'getDashboardGadgets',
    'Get gadgets from a specific Jira dashboard with optional filtering and analysis',
    getDashboardGadgetsSchema.shape,
    async (params: GetDashboardGadgetsParams, context: Record<string, any>) => {
      try {
        const result = await getDashboardGadgetsImpl(params, context);
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