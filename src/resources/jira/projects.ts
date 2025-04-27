import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { registerResource, createJsonResource } from '../../utils/mcp-resource.js';
import { AtlassianConfig } from '../../utils/atlassian-api.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import fetch from 'cross-fetch';

const logger = Logger.getLogger('JiraResource:Projects');

/**
 * Tạo headers cơ bản cho Atlassian API với Basic Authentication
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
 * Hàm helper để lấy danh sách projects
 */
async function getProjects(config: AtlassianConfig): Promise<any[]> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    
    // Chuẩn hóa baseUrl
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // URL API để lấy danh sách projects
    const url = `${baseUrl}/rest/api/2/project`;
    
    logger.debug(`Getting projects with direct fetch: ${url}`);
    
    // Sử dụng fetch
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit'
    });
    
    // Kiểm tra status code
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      
      logger.error(`Jira API error (${statusCode}):`, responseText);
      
      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        `Lỗi Jira API: ${responseText}`,
        statusCode,
        new Error(responseText)
      );
    }
    
    // Parse JSON
    const projects = await response.json();
    return projects;
  } catch (error: any) {
    logger.error(`Error getting projects:`, error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Lỗi khi lấy danh sách projects: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Hàm helper để lấy thông tin chi tiết project
 */
async function getProject(config: AtlassianConfig, projectKey: string): Promise<any> {
  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    
    // Chuẩn hóa baseUrl
    let baseUrl = config.baseUrl;
    if (!baseUrl.startsWith('https://')) {
      baseUrl = `https://${baseUrl}`;
    }
    
    // URL API để lấy thông tin project
    const url = `${baseUrl}/rest/api/2/project/${projectKey}`;
    
    logger.debug(`Getting project details with direct fetch: ${url}`);
    
    // Sử dụng fetch
    const response = await fetch(url, {
      method: 'GET',
      headers,
      credentials: 'omit'
    });
    
    // Kiểm tra status code
    if (!response.ok) {
      const statusCode = response.status;
      const responseText = await response.text();
      
      logger.error(`Jira API error (${statusCode}):`, responseText);
      
      if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Project ${projectKey} không tìm thấy`,
          statusCode,
          new Error(responseText)
        );
      }
      
      throw new ApiError(
        ApiErrorType.SERVER_ERROR,
        `Lỗi Jira API: ${responseText}`,
        statusCode,
        new Error(responseText)
      );
    }
    
    // Parse JSON
    const project = await response.json();
    return project;
  } catch (error: any) {
    logger.error(`Error getting project ${projectKey}:`, error);
    
    if (error instanceof ApiError) {
      throw error;
    }
    
    throw new ApiError(
      ApiErrorType.UNKNOWN_ERROR,
      `Lỗi khi lấy thông tin project: ${error instanceof Error ? error.message : String(error)}`,
      500,
      error instanceof Error ? error : new Error(String(error))
    );
  }
}

/**
 * Đăng ký các resources liên quan đến Jira projects
 * @param server MCP Server instance
 */
export function registerProjectResources(server: McpServer) {
  // Resource: Danh sách tất cả dự án
  registerResource(
    server,
    'jira-projects-list',
    new ResourceTemplate('jira://projects', { list: undefined }),
    'Danh sách tất cả các dự án trong Jira',
    async (params, { config, uri }) => {
      logger.info('Getting list of Jira projects');
      
      try {
        // Lấy danh sách dự án từ Jira API
        const projects = await getProjects(config);
        
        // Chuyển đổi response thành định dạng thân thiện hơn
        const formattedProjects = projects.map((project: any) => ({
          id: project.id,
          key: project.key,
          name: project.name,
          projectType: project.projectTypeKey,
          url: `${config.baseUrl}/browse/${project.key}`,
          lead: project.lead?.displayName || 'Unknown'
        }));
        
        // Trả về đúng định dạng MCP resource
        return createJsonResource(uri, {
          projects: formattedProjects,
          count: formattedProjects.length,
          message: `Tìm thấy ${formattedProjects.length} dự án`
        });
      } catch (error) {
        logger.error('Error getting Jira projects:', error);
        throw error;
      }
    }
  );
  
  // Resource: Thông tin chi tiết về một dự án
  registerResource(
    server,
    'jira-project-details',
    new ResourceTemplate('jira://projects/{projectKey}', { list: undefined }),
    'Thông tin chi tiết về một dự án trong Jira',
    async (params, { config, uri }) => {
      // Lấy projectKey từ URI pattern
      let projectKey = '';
      if (params && 'projectKey' in params) {
        projectKey = params.projectKey;
      } else {
        // Trích xuất từ URI path nếu params không có
        const uriParts = uri.split('/');
        projectKey = uriParts[uriParts.length - 1];
      }
      if (!projectKey) {
        throw new ApiError(
          ApiErrorType.VALIDATION_ERROR,
          'Project key không được cung cấp',
          400,
          new Error('Missing project key parameter')
        );
      }
      logger.info(`Getting details for Jira project: ${projectKey}`);
      try {
        // Lấy thông tin dự án từ Jira API
        const project = await getProject(config, projectKey);
        // Chuyển đổi response thành định dạng thân thiện hơn
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
        // Trả về đúng định dạng MCP resource
        return createJsonResource(uri, {
          project: formattedProject,
          message: `Thông tin chi tiết dự án ${projectKey}`
        });
      } catch (error) {
        logger.error(`Error getting Jira project ${projectKey}:`, error);
        throw error;
      }
    }
  );
}
