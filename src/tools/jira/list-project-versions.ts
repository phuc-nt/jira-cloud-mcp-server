import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:listProjectVersions');

// Input parameter schema
export const listProjectVersionsSchema = z.object({
  projectKey: z.string().describe('Project key to list versions from (e.g., PROJ, DEMO)'),
  includeArchived: z.boolean().optional().default(false).describe('Include archived versions (default: false)'),
  expand: z.string().optional().describe('Additional details to include (e.g., issuesstatus, operations)')
});

type ListProjectVersionsParams = z.infer<typeof listProjectVersionsSchema>;

async function listProjectVersionsToolImpl(params: ListProjectVersionsParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Listing versions for project: ${params.projectKey}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.expand) {
      queryParams.append('expand', params.expand);
    }

    const url = `${baseUrl}/rest/api/3/project/${encodeURIComponent(params.projectKey)}/versions${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (list project versions, ${response.status}):`, responseText);
      
      const statusCode = response.status;
      if (statusCode === 401) {
        throw new ApiError(
          ApiErrorType.AUTHENTICATION_ERROR,
          "Unauthorized. Check your credentials.",
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 403) {
        throw new ApiError(
          ApiErrorType.AUTHORIZATION_ERROR,
          `Forbidden. You don't have permission to view versions in project ${params.projectKey}.`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Project ${params.projectKey} not found`,
          statusCode,
          new Error(responseText)
        );
      } else {
        throw new ApiError(
          ApiErrorType.SERVER_ERROR,
          `Jira API error: ${responseText}`,
          statusCode,
          new Error(responseText)
        );
      }
    }

    const versions = await response.json();
    
    // Filter out archived versions if not requested
    const filteredVersions = params.includeArchived 
      ? versions 
      : versions.filter((version: any) => !version.archived);

    // Transform the response to include relevant version information
    const transformedVersions = filteredVersions.map((version: any) => ({
      id: version.id,
      name: version.name,
      description: version.description || null,
      archived: version.archived,
      released: version.released,
      releaseDate: version.releaseDate || null,
      startDate: version.startDate || null,
      projectId: version.projectId,
      self: version.self,
      // Include issue count if available from expand=issuesstatus
      issuesFixedCount: version.issuesStatusForFixVersion?.done || 0,
      issuesToDoCount: version.issuesStatusForFixVersion?.toDo || 0,
      issuesInProgressCount: version.issuesStatusForFixVersion?.inProgress || 0,
      // Include operations if available
      operations: version.operations || []
    }));

    // Sort versions by release date (unreleased first, then by date descending)
    transformedVersions.sort((a: any, b: any) => {
      if (!a.released && b.released) return -1;
      if (a.released && !b.released) return 1;
      
      if (a.releaseDate && b.releaseDate) {
        return new Date(b.releaseDate).getTime() - new Date(a.releaseDate).getTime();
      }
      if (a.releaseDate && !b.releaseDate) return -1;
      if (!a.releaseDate && b.releaseDate) return 1;
      
      return a.name.localeCompare(b.name);
    });

    logger.info(`Found ${transformedVersions.length} versions for project ${params.projectKey}`);

    return {
      success: true,
      data: {
        projectKey: params.projectKey,
        totalVersions: transformedVersions.length,
        releasedVersions: transformedVersions.filter((v: any) => v.released).length,
        unreleasedVersions: transformedVersions.filter((v: any) => !v.released).length,
        archivedVersions: transformedVersions.filter((v: any) => v.archived).length,
        versions: transformedVersions
      },
      message: `Found ${transformedVersions.length} versions in project ${params.projectKey}`
    };

  } catch (error) {
    logger.error('Error listing project versions:', error);
    
    if (error instanceof ApiError) {
      return {
        success: false,
        error: error.message,
        code: error.type
      };
    }
    
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      code: 'LIST_VERSIONS_FAILED'
    };
  }
}

export const registerListProjectVersionsTool = (server: McpServer) => {
  server.tool(
    'listProjectVersions',
    'List all Fix Versions (release versions) in a Jira project with status and issue counts',
    listProjectVersionsSchema.shape,
    async (params: ListProjectVersionsParams, context: Record<string, any>) => {
      try {
        const result = await listProjectVersionsToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in listProjectVersions tool:', error);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify({ 
                success: false, 
                error: error instanceof Error ? error.message : String(error),
                code: 'TOOL_EXECUTION_ERROR'
              }, null, 2)
            }
          ]
        };
      }
    }
  );
};
