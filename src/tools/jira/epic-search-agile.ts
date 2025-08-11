import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:epicSearchAgile');

// Epic search schema using Agile API approach
export const epicSearchAgileSchema = z.object({
  // Basic filtering
  projectKey: z.string().optional().describe('Project key to search within (e.g., XDEMO2)'),
  boardId: z.union([z.string(), z.number()]).optional().describe('Board ID to search within'),
  
  // Epic-specific search
  epicName: z.string().optional().describe('Epic name to search for (partial match)'),
  epicKey: z.string().optional().describe('Specific Epic key (exact match)'),
  epicStatus: z.enum(['To Do', 'In Progress', 'Done']).optional().describe('Epic status filter'),
  epicDone: z.boolean().optional().describe('Filter by Epic completion status'),
  
  // Search mode
  searchMode: z.enum(['epics-only', 'stories-by-epic', 'all']).default('epics-only').describe('Search mode: find Epics, find Stories under Epic, or both'),
  
  // Additional filtering for Stories mode
  storyStatus: z.array(z.string()).optional().describe('Story statuses when searching stories-by-epic'),
  assignee: z.string().optional().describe('Assignee filter for Stories'),
  
  // Pagination
  maxResults: z.number().default(50).describe('Maximum number of results (default: 50)'),
  startAt: z.number().default(0).describe('Starting index for pagination (default: 0)'),
  
  // Response configuration
  includeEpicDetails: z.boolean().default(true).describe('Include Epic color, progress, etc.'),
  includeChildIssues: z.boolean().default(false).describe('Include child issues (Stories/Tasks) under each Epic'),
  includeProgress: z.boolean().default(true).describe('Include progress statistics for Epics')
});

type EpicSearchAgileParams = z.infer<typeof epicSearchAgileSchema>;

/**
 * Search Epics using Agile API - more reliable than JQL with custom fields
 */
async function searchEpicsViaAgileAPI(params: EpicSearchAgileParams, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  let epics: any[] = [];
  
  if (params.epicKey) {
    // Direct Epic lookup by key
    try {
      const epicUrl = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(params.epicKey)}`;
      const epicResponse = await fetch(epicUrl, { method: 'GET', headers, credentials: 'omit' });
      
      if (epicResponse.ok) {
        const epic = await epicResponse.json();
        epics = [epic];
      }
    } catch (error) {
      logger.warn(`Direct Epic lookup failed for ${params.epicKey}:`, error);
    }
  } else {
    // Search approach: Get all Epics from board or project, then filter
    let searchUrl: string;
    
    if (params.boardId) {
      // Search via board - more efficient for Agile projects
      searchUrl = `${baseUrl}/rest/agile/1.0/board/${params.boardId}/epic`;
    } else {
      // Fallback: Search via JQL for Epics, then get details via Agile API
      const jqlParts = [`issuetype = "Epic"`];
      
      if (params.projectKey) {
        jqlParts.push(`project = "${params.projectKey}"`);
      }
      
      if (params.epicStatus) {
        jqlParts.push(`status = "${params.epicStatus}"`);
      }
      
      const jql = jqlParts.join(' AND ');
      searchUrl = `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key&maxResults=${params.maxResults}&startAt=${params.startAt}`;
    }
    
    try {
      const searchResponse = await fetch(searchUrl, { method: 'GET', headers, credentials: 'omit' });
      
      if (searchResponse.ok) {
        const searchData = await searchResponse.json();
        
        if (params.boardId) {
          // Board Epic API returns Agile format
          epics = searchData.values || [];
        } else {
          // JQL search returns issues, convert to Epic keys and fetch via Agile API
          const epicKeys = searchData.issues.map((issue: any) => issue.key);
          
          // Fetch each Epic via Agile API for consistent format
          epics = await Promise.all(
            epicKeys.map(async (key: string) => {
              try {
                const epicUrl = `${baseUrl}/rest/agile/1.0/epic/${encodeURIComponent(key)}`;
                const epicResponse = await fetch(epicUrl, { method: 'GET', headers, credentials: 'omit' });
                return epicResponse.ok ? await epicResponse.json() : null;
              } catch (error) {
                logger.warn(`Failed to fetch Epic details for ${key}:`, error);
                return null;
              }
            })
          );
          
          // Filter out failed lookups
          epics = epics.filter(epic => epic !== null);
        }
      }
    } catch (error) {
      logger.error('Epic search via Agile API failed:', error);
      throw new ApiError(ApiErrorType.SERVER_ERROR, 'Failed to search Epics via Agile API', 500);
    }
  }
  
  // Apply Epic name filtering (text search in Epic name)
  if (params.epicName && epics.length > 0) {
    const searchTerm = params.epicName.toLowerCase();
    epics = epics.filter(epic => 
      epic.name && epic.name.toLowerCase().includes(searchTerm)
    );
  }
  
  // Apply Epic done status filtering
  if (params.epicDone !== undefined && epics.length > 0) {
    epics = epics.filter(epic => epic.done === params.epicDone);
  }
  
  return epics;
}

/**
 * Get Stories under Epics using Agile API
 */
async function getStoriesForEpics(epicKeys: string[], params: EpicSearchAgileParams, config: AtlassianConfig) {
  const headers = createBasicHeaders(config.email, config.apiToken);
  const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);
  
  const storiesByEpic: Record<string, any[]> = {};
  
  await Promise.all(
    epicKeys.map(async (epicKey) => {
      try {
        // Use JQL to find Stories linked to this Epic
        const jqlParts = [`"Epic Link" = "${epicKey}"`];
        
        if (params.projectKey) {
          jqlParts.push(`project = "${params.projectKey}"`);
        }
        
        if (params.storyStatus && params.storyStatus.length > 0) {
          const statusFilter = params.storyStatus.map(s => `"${s}"`).join(',');
          jqlParts.push(`status in (${statusFilter})`);
        }
        
        if (params.assignee) {
          jqlParts.push(`assignee = "${params.assignee}"`);
        }
        
        const jql = jqlParts.join(' AND ');
        const searchUrl = `${baseUrl}/rest/api/3/search?jql=${encodeURIComponent(jql)}&fields=key,summary,status,assignee,customfield_10016&maxResults=100`;
        
        const response = await fetch(searchUrl, { method: 'GET', headers, credentials: 'omit' });
        
        if (response.ok) {
          const data = await response.json();
          storiesByEpic[epicKey] = data.issues.map((issue: any) => ({
            key: issue.key,
            summary: issue.fields.summary,
            status: issue.fields.status?.name,
            assignee: issue.fields.assignee ? {
              accountId: issue.fields.assignee.accountId,
              displayName: issue.fields.assignee.displayName
            } : null,
            storyPoints: issue.fields.customfield_10016 || 0
          }));
        } else {
          storiesByEpic[epicKey] = [];
        }
      } catch (error) {
        logger.warn(`Failed to get Stories for Epic ${epicKey}:`, error);
        storiesByEpic[epicKey] = [];
      }
    })
  );
  
  return storiesByEpic;
}

/**
 * Calculate Epic progress statistics
 */
function calculateEpicProgress(stories: any[]) {
  const totalStories = stories.length;
  const completedStories = stories.filter(story => story.status === 'Done').length;
  const totalStoryPoints = stories.reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  const completedStoryPoints = stories
    .filter(story => story.status === 'Done')
    .reduce((sum, story) => sum + (story.storyPoints || 0), 0);
  
  return {
    totalStories,
    completedStories,
    totalStoryPoints,
    completedStoryPoints,
    progressPercentage: totalStories > 0 ? Math.round((completedStories / totalStories) * 100) : 0,
    storyPointsProgress: totalStoryPoints > 0 ? Math.round((completedStoryPoints / totalStoryPoints) * 100) : 0
  };
}

/**
 * Format Epic results for consistent output
 */
function formatEpicResults(epics: any[], storiesByEpic: Record<string, any[]>, params: EpicSearchAgileParams) {
  return epics.map(epic => {
    const result: any = {
      key: epic.key,
      id: epic.id,
      name: epic.name,
      summary: epic.summary || epic.name,
      done: epic.done,
      color: epic.color?.key || epic.color,
      self: epic.self
    };
    
    if (params.includeEpicDetails) {
      result.epicDetails = {
        color: epic.color,
        done: epic.done,
        epicName: epic.name
      };
    }
    
    if (params.includeChildIssues || params.searchMode === 'stories-by-epic') {
      const stories = storiesByEpic[epic.key] || [];
      result.childIssues = stories;
      
      if (params.includeProgress) {
        result.progress = calculateEpicProgress(stories);
      }
    }
    
    return result;
  });
}

export async function epicSearchAgileImpl(params: EpicSearchAgileParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  
  logger.info(`Epic search via Agile API - Mode: ${params.searchMode}, Epic: ${params.epicName || params.epicKey || 'any'}`);
  
  try {
    // Step 1: Find Epics using Agile API
    const epics = await searchEpicsViaAgileAPI(params, config);
    
    if (epics.length === 0) {
      return {
        epics: [],
        total: 0,
        searchCriteria: params,
        searchMode: params.searchMode,
        message: 'No Epics found matching the criteria',
        success: true
      };
    }
    
    // Step 2: Get Stories if requested
    let storiesByEpic: Record<string, any[]> = {};
    
    if (params.searchMode === 'stories-by-epic' || params.includeChildIssues) {
      const epicKeys = epics.map(epic => epic.key);
      storiesByEpic = await getStoriesForEpics(epicKeys, params, config);
    }
    
    // Step 3: Format results
    const formattedResults = formatEpicResults(epics, storiesByEpic, params);
    
    // Calculate total counts
    const totalStories = Object.values(storiesByEpic).reduce((sum, stories) => sum + stories.length, 0);
    
    return {
      epics: formattedResults,
      total: epics.length,
      totalChildIssues: totalStories,
      searchCriteria: {
        mode: params.searchMode,
        epicName: params.epicName,
        epicKey: params.epicKey,
        projectKey: params.projectKey,
        boardId: params.boardId
      },
      apiApproach: 'agile-rest-api',
      success: true
    };
    
  } catch (error) {
    logger.error('Error in Epic search via Agile API:', error);
    throw error;
  }
}

export const registerEpicSearchAgileTool = (server: McpServer) => {
  server.tool(
    'epicSearchAgile',
    'Search Epics using Jira Agile REST API - more reliable than JQL custom fields. Supports Epic name search, Epic key lookup, and Stories-by-Epic search.',
    epicSearchAgileSchema.shape,
    async (params: EpicSearchAgileParams, context: Record<string, any>) => {
      try {
        const result = await epicSearchAgileImpl(params, context);
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
                error: error instanceof Error ? error.message : String(error),
                searchCriteria: params,
                apiApproach: 'agile-rest-api'
              })
            }
          ],
          isError: true
        };
      }
    }
  );
};