import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getDashboards, getMyDashboards, getDashboardById, getDashboardGadgets } from '../../utils/jira-resource-api.js';
import { createStandardResource, extractPagingParams, getAtlassianConfigFromEnv } from '../../utils/mcp-resource.js';
import { Logger } from '../../utils/logger.js';
import { dashboardSchema, dashboardListSchema, gadgetListSchema } from '../../schemas/jira.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';

const logger = Logger.getLogger('JiraDashboardResources');

// (Có thể bổ sung schema dashboardSchema, gadgetsSchema nếu cần)

export function registerDashboardResources(server: McpServer) {
  logger.info('Registering Jira dashboard resources...');

  // List all dashboards
  server.resource(
    'jira-dashboards',
    new ResourceTemplate('jira://dashboards', {
      list: async (_extra) => {
        return {
          resources: [
            {
              uri: 'jira://dashboards',
              name: 'Jira Dashboards',
              description: 'List and search all Jira dashboards',
              mimeType: 'application/json'
            }
          ]
        };
      }
    }),
    async (uri: string | URL, params: Record<string, any>, extra: any) => {
      try {
        // Get config from context or environment
        const config: AtlassianConfig = extra?.context?.atlassianConfig || getAtlassianConfigFromEnv();
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        
        const { limit = 50, offset = 0 } = extractPagingParams(params);
        const data = await getDashboards(config, offset, limit);
        return createStandardResource(
          uriStr,
          data.dashboards || [],
          'dashboards',
          dashboardListSchema,
          data.total || (data.dashboards ? data.dashboards.length : 0),
          limit,
          offset,
          `${config.baseUrl}/jira/dashboards` // UI URL
        );
      } catch (error) {
        logger.error(`Error handling resource request for jira-dashboards:`, error);
        throw error;
      }
    }
  );

  // List my dashboards
  server.resource(
    'jira-my-dashboards',
    new ResourceTemplate('jira://dashboards/my', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://dashboards/my',
            name: 'Jira My Dashboards',
            description: 'List dashboards owned by or shared with the current user.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri: string | URL, params: Record<string, any>, extra: any) => {
      try {
        // Get config from context or environment
        const config: AtlassianConfig = extra?.context?.atlassianConfig || getAtlassianConfigFromEnv();
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        
        const { limit = 50, offset = 0 } = extractPagingParams(params);
        const data = await getMyDashboards(config, offset, limit);
        return createStandardResource(
          uriStr,
          data.dashboards || [],
          'dashboards',
          dashboardListSchema,
          data.total || (data.dashboards ? data.dashboards.length : 0),
          limit,
          offset,
          `${config.baseUrl}/jira/dashboards?filter=my`
        );
      } catch (error) {
        logger.error(`Error handling resource request for jira-my-dashboards:`, error);
        throw error;
      }
    }
  );

  // Dashboard details
  server.resource(
    'jira-dashboard-details',
    new ResourceTemplate('jira://dashboards/{dashboardId}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://dashboards/{dashboardId}',
            name: 'Jira Dashboard Details',
            description: 'Get details of a specific Jira dashboard.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri: string | URL, params: Record<string, any>, extra: any) => {
      try {
        // Get config from context or environment
        const config: AtlassianConfig = extra?.context?.atlassianConfig || getAtlassianConfigFromEnv();
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        
        const dashboardId = params.dashboardId || (uriStr.split('/').pop());
        const dashboard = await getDashboardById(config, dashboardId);
        return createStandardResource(
          uriStr,
          [dashboard],
          'dashboard',
          dashboardSchema,
          1,
          1,
          0,
          `${config.baseUrl}/jira/dashboards/${dashboardId}`
        );
      } catch (error) {
        logger.error(`Error handling resource request for jira-dashboard-details:`, error);
        throw error;
      }
    }
  );

  // Dashboard gadgets
  server.resource(
    'jira-dashboard-gadgets',
    new ResourceTemplate('jira://dashboards/{dashboardId}/gadgets', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://dashboards/{dashboardId}/gadgets',
            name: 'Jira Dashboard Gadgets',
            description: 'List gadgets of a specific Jira dashboard.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri: string | URL, params: Record<string, any>, extra: any) => {
      try {
        // Get config from context or environment
        const config: AtlassianConfig = extra?.context?.atlassianConfig || getAtlassianConfigFromEnv();
        const uriStr = typeof uri === 'string' ? uri : uri.href;
        
        const dashboardId = params.dashboardId || (uriStr.split('/')[uriStr.split('/').length - 2]);
        const gadgets = await getDashboardGadgets(config, dashboardId);
        return createStandardResource(
          uriStr,
          gadgets,
          'gadgets',
          gadgetListSchema,
          gadgets.length,
          gadgets.length,
          0,
          `${config.baseUrl}/jira/dashboards/${dashboardId}`
        );
      } catch (error) {
        logger.error(`Error handling resource request for jira-dashboard-gadgets:`, error);
        throw error;
      }
    }
  );

  logger.info('Jira dashboard resources registered successfully');
}