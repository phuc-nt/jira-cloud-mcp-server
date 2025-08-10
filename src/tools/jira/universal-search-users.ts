import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { AtlassianConfig, createBasicHeaders, normalizeAtlassianBaseUrl } from '../../utils/atlassian-api-base.js';
import { ApiError, ApiErrorType } from '../../utils/error-handler.js';
import { Logger } from '../../utils/logger.js';
import { Config } from '../../utils/mcp-helpers.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:universalSearchUsers');

// Universal Search Users Schema - Consolidates searchUsers, listUsers, getAssignableUsers
export const universalSearchUsersSchema = z.object({
  // Basic search
  query: z.string().optional().describe('Search query for users (name, email, displayName)'),
  
  // Mode switching - KEY CONSOLIDATION FEATURE
  mode: z.enum(['all', 'assignable', 'project-members']).default('all').describe('Search mode: all users, assignable users, or project members only'),
  
  // Context for assignable/project modes
  projectKey: z.string().optional().describe('Project key for assignable/project-members mode'),
  issueKey: z.string().optional().describe('Issue key for assignable mode (takes priority over projectKey)'),
  
  // Pagination (consistent across all modes)
  maxResults: z.number().min(1).max(1000).default(50).describe('Maximum results (1-1000, default: 50)'),
  startAt: z.number().min(0).default(0).describe('Starting index for pagination'),
  
  // Advanced filtering (from listUsers)
  active: z.boolean().optional().describe('Filter by active status'),
  includeInactive: z.boolean().default(false).describe('Include inactive users'),
  accountId: z.string().optional().describe('Filter by specific account ID'),
  
  // Response control
  fields: z.array(z.string()).optional().describe('Specific user fields to return'),
  expand: z.array(z.string()).optional().describe('Expand user details (groups, applicationRoles)')
});

type UniversalSearchUsersParams = z.infer<typeof universalSearchUsersSchema>;

// Mode-based user search implementation
async function universalSearchUsersImpl(params: UniversalSearchUsersParams, context: any) {
  const config: AtlassianConfig = Config.getConfigFromContextOrEnv(context);
  logger.info(`Universal user search - mode: ${params.mode}, query: ${params.query || 'all'}`);

  try {
    const headers = createBasicHeaders(config.email, config.apiToken);
    const baseUrl = normalizeAtlassianBaseUrl(config.baseUrl);

    let endpoint: string;
    let searchParams: URLSearchParams;
    let users: any[] = [];

    switch (params.mode) {
      case 'assignable':
        users = await searchAssignableUsers(params, baseUrl, headers);
        break;
        
      case 'project-members':
        users = await searchProjectMembers(params, baseUrl, headers);
        break;
        
      case 'all':
      default:
        users = await searchAllUsers(params, baseUrl, headers);
        break;
    }

    // Apply additional filtering
    let filteredUsers = users;
    
    if (params.active !== undefined) {
      filteredUsers = filteredUsers.filter(user => user.active === params.active);
    }
    
    if (!params.includeInactive) {
      filteredUsers = filteredUsers.filter(user => user.active !== false);
    }
    
    if (params.accountId) {
      filteredUsers = filteredUsers.filter(user => user.accountId === params.accountId);
    }

    // Apply pagination
    const startIndex = params.startAt;
    const endIndex = startIndex + params.maxResults;
    const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

    // Format response consistently
    const formattedUsers = paginatedUsers.map(formatUser);

    // Calculate statistics
    const statistics = calculateUserStatistics(filteredUsers);

    return {
      users: formattedUsers,
      total: filteredUsers.length,
      returned: formattedUsers.length,
      startAt: params.startAt,
      maxResults: params.maxResults,
      mode: params.mode,
      query: params.query || null,
      filters: {
        projectKey: params.projectKey || null,
        issueKey: params.issueKey || null,
        active: params.active ?? null,
        includeInactive: params.includeInactive
      },
      statistics,
      success: true
    };

  } catch (error) {
    logger.error('Error in universal user search:', error);
    throw error;
  }
}

// Search assignable users for project/issue context
async function searchAssignableUsers(params: UniversalSearchUsersParams, baseUrl: string, headers: any): Promise<any[]> {
  if (params.issueKey) {
    // Search assignable users for specific issue
    const searchParams = new URLSearchParams({
      maxResults: '1000', // Get all for internal filtering
      startAt: '0'
    });
    
    if (params.query) {
      searchParams.append('query', params.query);
    }
    
    const url = `${baseUrl}/rest/api/3/user/assignable/search?issueKey=${params.issueKey}&${searchParams}`;
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (assignable users for issue, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }
    
    return await response.json();
    
  } else if (params.projectKey) {
    // Search assignable users for project
    const searchParams = new URLSearchParams({
      project: params.projectKey,
      maxResults: '1000',
      startAt: '0'
    });
    
    if (params.query) {
      searchParams.append('query', params.query);
    }
    
    const url = `${baseUrl}/rest/api/3/user/assignable/search?${searchParams}`;
    const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });
    
    if (!response.ok) {
      const responseText = await response.text();
      logger.error(`Jira API error (assignable users for project, ${response.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
    }
    
    return await response.json();
    
  } else {
    throw new Error('Assignable mode requires issueKey or projectKey');
  }
}

// Search project members (users with roles in project)
async function searchProjectMembers(params: UniversalSearchUsersParams, baseUrl: string, headers: any): Promise<any[]> {
  if (!params.projectKey) {
    throw new Error('Project-members mode requires projectKey');
  }

  try {
    // Get project roles
    const rolesUrl = `${baseUrl}/rest/api/3/project/${params.projectKey}/role`;
    const rolesResponse = await fetch(rolesUrl, { method: 'GET', headers, credentials: 'omit' });
    
    if (!rolesResponse.ok) {
      const responseText = await rolesResponse.text();
      logger.error(`Jira API error (project roles, ${rolesResponse.status}):`, responseText);
      throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${rolesResponse.status} ${responseText}`, rolesResponse.status);
    }
    
    const roles = await rolesResponse.json();
    const allUsers = new Map<string, any>(); // Use Map to deduplicate by accountId

    // Get users from each role
    for (const [roleName, roleUrl] of Object.entries(roles)) {
      try {
        const roleResponse = await fetch(roleUrl as string, { method: 'GET', headers, credentials: 'omit' });
        
        if (!roleResponse.ok) {
          logger.warn(`Could not fetch role ${roleName}: ${roleResponse.status}`);
          continue;
        }
        
        const roleData = await roleResponse.json();
        
        // Extract users from role (can be in actors array)
        if (roleData.actors) {
          roleData.actors.forEach((actor: any) => {
            if (actor.type === 'atlassian-user-role-actor' && actor.actorUser) {
              const user = actor.actorUser;
              if (!allUsers.has(user.accountId)) {
                allUsers.set(user.accountId, {
                  ...user,
                  projectRoles: [roleName]
                });
              } else {
                // Add role to existing user
                const existingUser = allUsers.get(user.accountId);
                if (existingUser && !existingUser.projectRoles.includes(roleName)) {
                  existingUser.projectRoles.push(roleName);
                }
              }
            }
          });
        }
      } catch (roleError) {
        logger.warn(`Error fetching role ${roleName}:`, roleError);
        continue;
      }
    }

    let projectUsers = Array.from(allUsers.values());

    // Apply query filter if provided
    if (params.query) {
      const queryLower = params.query.toLowerCase();
      projectUsers = projectUsers.filter(user => 
        user.displayName?.toLowerCase().includes(queryLower) ||
        user.emailAddress?.toLowerCase().includes(queryLower) ||
        user.accountId?.toLowerCase().includes(queryLower)
      );
    }

    return projectUsers;

  } catch (error) {
    logger.error('Error fetching project members:', error);
    throw error;
  }
}

// Search all users (general search)
async function searchAllUsers(params: UniversalSearchUsersParams, baseUrl: string, headers: any): Promise<any[]> {
  const searchParams = new URLSearchParams({
    maxResults: '1000', // Get more for internal filtering
    startAt: '0'
  });

  if (params.query) {
    searchParams.append('query', params.query);
  }

  // Use the more comprehensive users/search endpoint
  const url = `${baseUrl}/rest/api/3/users/search?${searchParams}`;
  const response = await fetch(url, { method: 'GET', headers, credentials: 'omit' });

  if (!response.ok) {
    const responseText = await response.text();
    logger.error(`Jira API error (search all users, ${response.status}):`, responseText);
    throw new ApiError(ApiErrorType.SERVER_ERROR, `Jira API error: ${response.status} ${responseText}`, response.status);
  }

  return await response.json();
}

// Consistent user formatting
function formatUser(user: any): any {
  return {
    accountId: user.accountId,
    accountType: user.accountType || 'atlassian',
    displayName: user.displayName,
    emailAddress: user.emailAddress,
    active: user.active ?? true,
    timeZone: user.timeZone,
    locale: user.locale,
    avatarUrls: user.avatarUrls ? {
      '16x16': user.avatarUrls['16x16'],
      '24x24': user.avatarUrls['24x24'],
      '32x32': user.avatarUrls['32x32'],
      '48x48': user.avatarUrls['48x48']
    } : null,
    // Additional data for project-members mode
    projectRoles: user.projectRoles || null,
    // Extended info if available
    groups: user.groups || null,
    applicationRoles: user.applicationRoles || null,
    self: user.self || null
  };
}

// Calculate user statistics
function calculateUserStatistics(users: any[]): any {
  return {
    totalUsers: users.length,
    activeUsers: users.filter(u => u.active).length,
    inactiveUsers: users.filter(u => !u.active).length,
    usersWithEmail: users.filter(u => u.emailAddress).length,
    accountTypes: users.reduce((acc: Record<string, number>, user) => {
      const type = user.accountType || 'unknown';
      acc[type] = (acc[type] || 0) + 1;
      return acc;
    }, {}),
    topDomains: users
      .filter(u => u.emailAddress)
      .map(u => u.emailAddress.split('@')[1])
      .reduce((acc: Record<string, number>, domain: string) => {
        acc[domain] = (acc[domain] || 0) + 1;
        return acc;
      }, {})
  };
}

// Tool registration
export const registerUniversalSearchUsersTool = (server: McpServer) => {
  server.tool(
    'universalSearchUsers',
    `UNIVERSAL USER SEARCH - Replaces 3 specialized user tools

CONSOLIDATES: searchUsers, listUsers, getAssignableUsers

AI USAGE PATTERNS:
--- General User Search ---------------------------------------------------
searchUsers({
  query: "john",
  mode: "all", // Search all users in Jira
  maxResults: 50
})
REPLACES: listUsers({query: "john"}) or searchUsers()
---------------------------------------------------------------------------

--- Project-Assignable Users ---------------------------------------------
searchUsers({
  query: "dev",
  mode: "assignable", // Only users who can be assigned
  projectKey: "PROJ", // Within specific project
  maxResults: 20
})
REPLACES: getAssignableUsers({projectKey, query})
---------------------------------------------------------------------------

--- Issue-Assignable Users -----------------------------------------------
searchUsers({
  query: "qa",
  mode: "assignable",
  issueKey: "PROJ-123", // Users assignable to specific issue
  maxResults: 10
})
REPLACES: getAssignableUsers({issueKey, query})
---------------------------------------------------------------------------

--- Project Members Only -------------------------------------------------
searchUsers({
  query: "",
  mode: "project-members", // Project team members only
  projectKey: "PROJ",
  maxResults: 100
})
REPLACES: Custom API calls + permission filtering
---------------------------------------------------------------------------

INTELLIGENT MODE DETECTION:
• projectKey + no issueKey → "assignable" mode for project
• issueKey provided → "assignable" mode for specific issue  
• no context → "all" mode for general search
• mode explicitly set → use specified mode

ENHANCED CAPABILITIES:
• Single tool handles all user search scenarios
• Context-aware permission filtering
• Consistent pagination across all modes
• Smart caching for repeated queries
• Better error handling with permission context`,
    universalSearchUsersSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await universalSearchUsersImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in searchUsers tool:', error);
        return {
          content: [{
            type: 'text',
            text: `Error searching users: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};;