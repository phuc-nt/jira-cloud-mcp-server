import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:getProjectVersion');

// Input parameter schema
export const getProjectVersionSchema = z.object({
  versionId: z.string().describe('Version ID to retrieve (e.g., 10100)'),
  expand: z.string().optional().describe('Additional details to include (e.g., issuesstatus, operations)')
});

type GetProjectVersionParams = z.infer<typeof getProjectVersionSchema>;

async function getProjectVersionToolImpl(params: GetProjectVersionParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Getting version details for ID: ${params.versionId}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    // Build query parameters
    const queryParams = new URLSearchParams();
    if (params.expand) {
      queryParams.append('expand', params.expand);
    }

    const url = `${baseUrl}/rest/api/3/version/${encodeURIComponent(params.versionId)}${
      queryParams.toString() ? `?${queryParams.toString()}` : ''
    }`;

    const response = await fetch(url, { 
      method: 'GET',
      headers, 
      credentials: 'omit' 
    });

    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (get version, ${response.status}):`, responseText);
      
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
          `Forbidden. You don't have permission to view this version.`,
          statusCode,
          new Error(responseText)
        );
      } else if (statusCode === 404) {
        throw new ApiError(
          ApiErrorType.NOT_FOUND_ERROR,
          `Version ${params.versionId} not found`,
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

    const version = await response.json();
    
    // Calculate release progress if issue status is available
    let releaseProgress = null;
    if (version.issuesStatusForFixVersion) {
      const issueStatus = version.issuesStatusForFixVersion;
      const totalIssues = (issueStatus.done || 0) + (issueStatus.toDo || 0) + (issueStatus.inProgress || 0);
      
      if (totalIssues > 0) {
        releaseProgress = {
          totalIssues,
          doneIssues: issueStatus.done || 0,
          inProgressIssues: issueStatus.inProgress || 0,
          todoIssues: issueStatus.toDo || 0,
          completionPercentage: Math.round(((issueStatus.done || 0) / totalIssues) * 100)
        };
      }
    }

    // Calculate days until/since release
    let releaseDateInfo = null;
    if (version.releaseDate) {
      const releaseDate = new Date(version.releaseDate);
      const today = new Date();
      const diffTime = releaseDate.getTime() - today.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      
      releaseDateInfo = {
        releaseDate: version.releaseDate,
        daysUntilRelease: diffDays > 0 ? diffDays : null,
        daysSinceRelease: diffDays <= 0 ? Math.abs(diffDays) : null,
        isOverdue: diffDays < 0 && !version.released,
        status: diffDays > 0 ? 'upcoming' : diffDays === 0 ? 'today' : 'past'
      };
    }

    const transformedVersion = {
      id: version.id,
      name: version.name,
      description: version.description || null,
      archived: version.archived,
      released: version.released,
      releaseDate: version.releaseDate || null,
      startDate: version.startDate || null,
      projectId: version.projectId,
      self: version.self,
      operations: version.operations || [],
      releaseProgress,
      releaseDateInfo
    };

    logger.info(`Retrieved version details: ${version.name} (ID: ${version.id})`);

    return {
      success: true,
      data: transformedVersion,
      message: `Version ${version.name} details retrieved successfully`
    };

  } catch (error) {
    logger.error('Error getting version details:', error);
    
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
      code: 'GET_VERSION_FAILED'
    };
  }
}

export const registerGetProjectVersionTool = (server: McpServer) => {
  server.tool(
    'getProjectVersion',
    'Get detailed information about a specific Fix Version including progress and release timeline',
    getProjectVersionSchema.shape,
    async (params: GetProjectVersionParams, context: Record<string, any>) => {
      try {
        const result = await getProjectVersionToolImpl(params, context);
        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2)
            }
          ]
        };
      } catch (error) {
        logger.error('Error in getProjectVersion tool:', error);
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
