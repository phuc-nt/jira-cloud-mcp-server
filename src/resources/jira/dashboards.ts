import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getDashboards, getMyDashboards, getDashboardById, getDashboardGadgets } from '../../utils/jira-resource-api.js';
import { createStandardResource, extractPagingParams, registerResource } from '../../utils/mcp-resource.js';
import { Logger } from '../../utils/logger.js';
import { dashboardSchema, dashboardListSchema, gadgetListSchema } from '../../schemas/jira.js';

const logger = Logger.getLogger('JiraDashboardResources');

// (Có thể bổ sung schema dashboardSchema, gadgetsSchema nếu cần)

export function registerDashboardResources(server: McpServer) {
  logger.info('Registering Jira dashboard resources...');

  // List all dashboards
  registerResource(
    server,
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
    'List all Jira dashboards',
    async (params, { config, uri }) => {
      const { limit = 50, offset = 0 } = extractPagingParams(params);
      const data = await getDashboards(config, offset, limit);
      return createStandardResource(
        uri,
        data.dashboards || [],
        'dashboards',
        dashboardListSchema,
        data.total || (data.dashboards ? data.dashboards.length : 0),
        limit,
        offset,
        `${config.baseUrl}/jira/dashboards` // UI URL
      );
    }
  );

  // List my dashboards
  registerResource(
    server,
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
    'List dashboards owned by current user',
    async (params, { config, uri }) => {
      const { limit = 50, offset = 0 } = extractPagingParams(params);
      const data = await getMyDashboards(config, offset, limit);
      return createStandardResource(
        uri,
        data.dashboards || [],
        'dashboards',
        dashboardListSchema,
        data.total || (data.dashboards ? data.dashboards.length : 0),
        limit,
        offset,
        `${config.baseUrl}/jira/dashboards?filter=my`
      );
    }
  );

  // Dashboard details
  registerResource(
    server,
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
    'Get details of a Jira dashboard',
    async (params, { config, uri }) => {
      const dashboardId = params.dashboardId || (uri.split('/').pop());
      const dashboard = await getDashboardById(config, dashboardId);
      return createStandardResource(
        uri,
        [dashboard],
        'dashboard',
        dashboardSchema,
        1,
        1,
        0,
        `${config.baseUrl}/jira/dashboards/${dashboardId}`
      );
    }
  );

  // Dashboard gadgets
  registerResource(
    server,
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
    'List gadgets of a Jira dashboard',
    async (params, { config, uri }) => {
      const dashboardId = params.dashboardId || (uri.split('/')[uri.split('/').length - 2]);
      const gadgets = await getDashboardGadgets(config, dashboardId);
      return createStandardResource(
        uri,
        gadgets,
        'gadgets',
        gadgetListSchema,
        gadgets.length,
        gadgets.length,
        0,
        `${config.baseUrl}/jira/dashboards/${dashboardId}`
      );
    }
  );

  logger.info('Jira dashboard resources registered successfully');
}