import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { getDashboards, getMyDashboards, getDashboardById, getDashboardGadgets } from '../../utils/atlassian-api.js';
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
    new ResourceTemplate('jira://dashboards', { list: undefined }),
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
    new ResourceTemplate('jira://dashboards/my', { list: undefined }),
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
    new ResourceTemplate('jira://dashboards/{dashboardId}', { list: undefined }),
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
    new ResourceTemplate('jira://dashboards/{dashboardId}/gadgets', { list: undefined }),
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