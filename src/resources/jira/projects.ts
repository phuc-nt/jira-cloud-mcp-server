import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResource, createJsonResource, createStandardResource } from '../../utils/mcp-resource.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import fetch from 'cross-fetch';
import { projectsListSchema, projectSchema } from '../../schemas/jira.js';
import { getProjects as getProjectsApi, getProject as getProjectApi } from '../../utils/jira-resource-api.js';

const logger = Logger.getLogger('JiraResource:Projects');

/**
 * Create basic headers for Atlassian API with Basic Authentication
 */
function createBasicHeaders(email: string, apiToken: string) {
  const auth = Buffer.from(`${email}:${apiToken}`).toString('base64');
  return {
    'Authorization': `Basic ${auth}`,
    'Content-Type': 'application/json',
    'Accept': 'application/json',
    'User-Agent': 'MCP-Atlassian-Server/1.0.0'
  };
}

/**
 * Helper function to get the list of projects
 */
async function getProjects(config: AtlassianConfig): Promise<any[]> {
  return await getProjectsApi(config);
}

/**
 * Helper function to get project details
 */
async function getProject(config: AtlassianConfig, projectKey: string): Promise<any> {
  return await getProjectApi(config, projectKey);
}

/**
 * Register resources related to Jira projects
 * @param server MCP Server instance
 */
export function registerProjectResources(server: McpServer) {
  // Resource: List all projects
  registerResource(
    server,
    'jira-projects-list',
    new ResourceTemplate('jira://projects', {
      list: async (_extra) => {
        return {
          resources: [
            {
              uri: 'jira://projects',
              name: 'Jira Projects',
              description: 'List and search all Jira projects',
              mimeType: 'application/json'
            }
          ]
        };
      }
    }),
    'List of all projects in Jira',
    async (params, { config, uri }) => {
      logger.info('Getting list of Jira projects');
      try {
        // Get the list of projects from Jira API
        const projects = await getProjects(config);
        // Convert response to a more friendly format
        const formattedProjects = projects.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          projectType: project.projectTypeKey,
          url: `${config.baseUrl}/browse/${project.key}`,
          lead: project.lead?.displayName || 'Unknown'
        }));
        // Return standardized resource with metadata and schema
        return createStandardResource(
          uri,
          formattedProjects,
          'projects',
          projectsListSchema,
          formattedProjects.length,
          formattedProjects.length,
          0,
          `${config.baseUrl}/jira/projects`
        );
      } catch (error) {
        logger.error('Error getting Jira projects:', error);
        throw error;
      }
    }
  );
  
  // Resource: Project details
  registerResource(
    server,
    'jira-project-details',
    new ResourceTemplate('jira://projects/{projectKey}', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://projects/{projectKey}',
            name: 'Jira Project Details',
            description: 'Get details for a specific Jira project by key. Replace {projectKey} with the project key.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'Details of a project in Jira',
    async (params, { config, uri }) => {
      // Get projectKey from URI pattern
      let projectKey = '';
      if (params && 'projectKey' in params) {
        projectKey = params.projectKey;
      } else {
        // Extract from URI path if params does not have it
        const uriParts = uri.split('/');
        projectKey = uriParts[uriParts.length - 1];
      }
      if (!projectKey) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          'Project key not provided',
          400,
          new Error('Missing project key parameter')
        );
      }
      logger.info(`Getting details for Jira project: ${projectKey}`);
      try {
        // Get project info from Jira API
        const project = await getProject(config, projectKey);
        // Convert response to a more friendly format
        const formattedProject = {
          id: project.id,
          key: project.key,
          name: project.name,
          description: project.description || 'No description',
          lead: project.lead?.displayName || 'Unknown',
          url: `${config.baseUrl}/browse/${project.key}`,
          projectCategory: project.projectCategory?.name || 'Uncategorized',
          projectType: project.projectTypeKey
        };
        // Chuẩn hóa metadata/schema
        return createStandardResource(
          uri,
          [formattedProject],
          'project',
          projectSchema,
          1,
          1,
          0,
          `${config.baseUrl}/browse/${project.key}`
        );
      } catch (error) {
        logger.error(`Error getting Jira project ${projectKey}:`, error);
        throw error;
      }
    }
  );

  // Resource: List roles of a project
  registerResource(
    server,
    'jira-project-roles',
    new ResourceTemplate('jira://projects/{projectKey}/roles', {
      list: async (_extra) => ({
        resources: [
          {
            uri: 'jira://projects/{projectKey}/roles',
            name: 'Jira Project Roles',
            description: 'List roles for a Jira project. Replace {projectKey} with the project key.',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    'List of roles of a project in Jira',
    async (params, { config, uri }) => {
      let projectKey = '';
      if (params && 'projectKey' in params) {
        projectKey = Array.isArray(params.projectKey) ? params.projectKey[0] : params.projectKey;
      } else {
        // Extract from URI path if params does not have it
        const uriParts = uri.split('/');
        projectKey = uriParts[uriParts.length - 2];
      }
      if (!projectKey) {
        throw new Error('Missing projectKey');
      }
      logger.info(`Getting roles for Jira project: ${projectKey}`);
      try {
        const auth = Buffer.from(`${config.email}:${config.apiToken}`).toString('base64');
        const headers = {
          'Authorization': `Basic ${auth}`,
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'MCP-Atlassian-Server/1.0.0'
        };
        let baseUrl = config.baseUrl;
        if (!baseUrl.startsWith('https://')) baseUrl = `https://${baseUrl}`;
        const url = `${baseUrl}/rest/api/3/project/${encodeURIComponent(projectKey)}/role`;
        logger.debug(`Calling Jira API: ${url}`);
        const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
        if (!response.ok) {
          const statusCode = response.status;
          const responseText = await response.text();
          logger.error(`Jira API error (${statusCode}):`, responseText);
          throw new Error(`Jira API error: ${responseText}`);
        }
        const data = await response.json();
        // data is an object: key is roleName, value is URL containing roleId
        const roles = Object.entries(data).map(([roleName, url]) => {
          const urlStr = String(url);
          const match = urlStr.match(/\/role\/(\d+)$/);
          return {
            roleName,
            roleId: match ? match[1] : '',
            url: urlStr
          };
        });
        // Chuẩn hóa metadata/schema (dùng array of role object, schema tự tạo inline)
        const rolesListSchema = {
          type: "array",
          items: {
            type: "object",
            properties: {
              roleName: { type: "string" },
              roleId: { type: "string" },
              url: { type: "string" }
            },
            required: ["roleName", "roleId", "url"]
          }
        };
        return createStandardResource(
          uri,
          roles,
          'roles',
          rolesListSchema,
          roles.length,
          roles.length,
          0,
          `${config.baseUrl}/browse/${projectKey}/project-roles`
        );
      } catch (error) {
        logger.error(`Error getting roles for Jira project ${projectKey}:`, error);
        throw error;
      }
    }
  );
}
