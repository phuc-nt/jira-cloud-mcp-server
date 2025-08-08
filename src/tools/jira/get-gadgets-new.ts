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
  logger.info('Getting available Jira gadgets');
  
  try {
    const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
    logger.debug('Config loaded successfully');

    // Try the API first
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
    const url = `${baseUrl}/rest/api/3/dashboard/gadgets`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (response.ok) {
      const responseText = await response.text();
      logger.info('Gadgets API response received, parsing...');
      
      try {
        const result = JSON.parse(responseText);
        // Process successful API response
        let formattedGadgets = [];
        
        if (Array.isArray(result)) {
          formattedGadgets = result;
        } else if (result.gadgets && Array.isArray(result.gadgets)) {
          formattedGadgets = result.gadgets;
        } else if (result.values && Array.isArray(result.values)) {
          formattedGadgets = result.values;
        }

        return {
          gadgets: formattedGadgets,
          total: formattedGadgets.length,
          success: true,
          source: 'api'
        };
      } catch (parseError) {
        logger.warn('JSON parsing failed, falling back to standard gadgets');
        // Fall through to fallback
      }
    } else {
      logger.warn(`Gadgets API returned ${response.status}, falling back to standard gadgets`);
      // Fall through to fallback
    }
  } catch (error) {
    logger.warn('Gadgets API call failed, falling back to standard gadgets:', error);
    // Fall through to fallback
  }

  // Fallback with standard gadgets
  const standardGadgets = [
    {
      key: 'filter-results-gadget',
      title: 'Filter Results',
      description: 'Display results from a saved filter',
      gadgetType: 'filter'
    },
    {
      key: 'pie-chart-gadget',
      title: 'Pie Chart',
      description: 'Display filter results as a pie chart',
      gadgetType: 'chart'
    },
    {
      key: 'stats-gadget',
      title: 'Two-dimensional Statistics',
      description: 'Show statistics for a filter in a two-dimensional grid',
      gadgetType: 'stats'
    },
    {
      key: 'created-vs-resolved-chart',
      title: 'Created vs Resolved Issues Chart',
      description: 'Display a chart showing created vs resolved issues over time',
      gadgetType: 'chart'
    },
    {
      key: 'resolution-time-gadget',
      title: 'Resolution Time',
      description: 'Display average resolution time for issues',
      gadgetType: 'stats'
    },
    {
      key: 'assigned-to-me-gadget',
      title: 'Assigned to Me',
      description: 'Display issues assigned to the current user',
      gadgetType: 'filter'
    },
    {
      key: 'activity-streams-gadget',
      title: 'Activity Stream',
      description: 'Display recent activity from projects',
      gadgetType: 'activity'
    },
    {
      key: 'introduction-gadget',
      title: 'Introduction',
      description: 'Welcome message and getting started information',
      gadgetType: 'info'
    }
  ];

  return {
    gadgets: standardGadgets,
    total: standardGadgets.length,
    success: true,
    source: 'fallback',
    note: 'Standard Jira gadgets list (API endpoint not available in this instance)'
  };
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
        logger.error('Error in getJiraGadgets tool:', error);
        
        // Return fallback gadgets even if implementation fails
        const fallbackResult = {
          gadgets: [
            { key: 'filter-results-gadget', title: 'Filter Results', description: 'Display results from a saved filter', gadgetType: 'filter' },
            { key: 'pie-chart-gadget', title: 'Pie Chart', description: 'Display filter results as a pie chart', gadgetType: 'chart' },
            { key: 'stats-gadget', title: 'Two-dimensional Statistics', description: 'Show statistics for a filter in a two-dimensional grid', gadgetType: 'stats' },
            { key: 'activity-streams-gadget', title: 'Activity Stream', description: 'Display recent activity from projects', gadgetType: 'activity' }
          ],
          total: 4,
          success: true,
          source: 'error-fallback',
          note: 'Standard Jira gadgets list (error occurred in API call)',
          error: error instanceof Error ? error.message : String(error)
        };
        
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(fallbackResult, null, 2)
            }
          ]
        };
      }
    }
  );
};