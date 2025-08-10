import { z } from 'zod';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';

// Import enhanced tools for delegation
import { createIssueToolImpl, createIssueSchema } from './create-issue.js';
import { enhancedGetIssueImpl, enhancedGetIssueSchema } from './enhanced-get-issue.js';
import { enhancedUpdateIssueImpl, enhancedUpdateIssueSchema } from './enhanced-update-issue.js';
import { enhancedSearchIssuesImpl, enhancedSearchIssuesSchema } from './enhanced-search-issues.js';

// Initialize logger
const logger = Logger.getLogger('JiraTools:DeprecatedFacade');

// Facade function for deprecation warnings
function showDeprecationWarning(oldTool: string, newPattern: string) {
  console.warn(`
🚨 DEPRECATION WARNING: ${oldTool}
📄 This tool will be removed in v4.0.0
✅ Migrate to: ${newPattern}
📖 See migration guide: docs/migration/tool-consolidation-guide.md
  `);
}

// ========================================
// 1. createStory → createIssue facade
// ========================================
export const createStorySchema = z.object({
  projectKey: z.string().describe('Project key'),
  summary: z.string().describe('Story summary'),
  description: z.string().optional().describe('Story description'),
  epicKey: z.string().optional().describe('Epic key to link this story to'),
  storyPoints: z.number().optional().describe('Story points estimation'),
  assignee: z.string().optional().describe('Assignee account ID'),
  priority: z.string().optional().describe('Priority name'),
  labels: z.array(z.string()).optional().describe('Story labels')
});

async function createStoryFacadeImpl(params: any, context: any) {
  showDeprecationWarning('createStory', 'createIssue({...params}) // Auto-detects Story from epicKey/storyPoints');
  
  // Map parameters to enhanced createIssue
  const enhancedParams = {
    ...params,
    // epicKey or storyPoints will trigger Story type auto-detection in createIssue
  };
  
  return createIssueToolImpl(enhancedParams, context);
}

export const registerCreateStoryTool = (server: McpServer) => {
  server.tool(
    'createStory',
    `[DEPRECATED] Use enhanced 'createIssue' instead

MIGRATION:
OLD: createStory({projectKey, summary, epicKey, storyPoints})
NEW: createIssue({projectKey, summary, epicKey, storyPoints}) // Auto-detects Story

This tool will be removed in v4.0.0. The enhanced 'createIssue' provides:
• Automatic Story type detection from epicKey/storyPoints
• Better error handling and validation
• Consistent parameter patterns
• Support for all issue types with intelligent detection

ENHANCED REPLACEMENT CAPABILITIES:
createIssue supports ALL issue types with intelligent detection:
• Epic: provide 'epicName' → auto-detects Epic
• Story: provide 'epicKey' or 'storyPoints' → auto-detects Story  
• Sub-task: provide 'parentKey' → auto-detects Sub-task
• Task/Bug: specify 'issueType' explicitly

See createIssue tool for complete usage patterns.`,
    createStorySchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await createStoryFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in createStory facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error creating story: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 2. createSubtask → createIssue facade
// ========================================
export const createSubtaskSchema = z.object({
  projectKey: z.string().describe('Project key'),
  parentKey: z.string().describe('Parent issue key'),
  summary: z.string().describe('Sub-task summary'),
  description: z.string().optional().describe('Sub-task description'),
  assignee: z.string().optional().describe('Assignee account ID'),
  priority: z.string().optional().describe('Priority name')
});

async function createSubtaskFacadeImpl(params: any, context: any) {
  showDeprecationWarning('createSubtask', 'createIssue({...params}) // Auto-detects Sub-task from parentKey');
  
  return createIssueToolImpl(params, context);
}

export const registerCreateSubtaskTool = (server: McpServer) => {
  server.tool(
    'createSubtask',
    `[DEPRECATED] Use enhanced 'createIssue' instead

MIGRATION:
OLD: createSubtask({projectKey, parentKey, summary})
NEW: createIssue({projectKey, parentKey, summary}) // Auto-detects Sub-task

This tool will be removed in v4.0.0. The enhanced 'createIssue' provides:
• Automatic Sub-task type detection from parentKey
• Better parent-child relationship handling
• Consistent parameter patterns
• Support for all issue types

See createIssue tool for complete usage patterns.`,
    createSubtaskSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await createSubtaskFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in createSubtask facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error creating subtask: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 3. createBulkSubtasks → createIssue facade
// ========================================
export const createBulkSubtasksSchema = z.object({
  projectKey: z.string().describe('Project key'),
  parentKey: z.string().describe('Parent issue key'),
  subtasks: z.array(z.object({
    summary: z.string().describe('Sub-task summary'),
    description: z.string().optional().describe('Sub-task description'),
    assignee: z.string().optional().describe('Assignee account ID'),
    priority: z.string().optional().describe('Priority name')
  })).describe('Array of subtasks to create')
});

async function createBulkSubtasksFacadeImpl(params: any, context: any) {
  showDeprecationWarning('createBulkSubtasks', 'Multiple createIssue() calls with parentKey');
  
  // Create multiple subtasks using enhanced createIssue
  const results = [];
  for (const subtask of params.subtasks) {
    const subtaskParams = {
      projectKey: params.projectKey,
      parentKey: params.parentKey,
      ...subtask
    };
    
    try {
      const result = await createIssueToolImpl(subtaskParams, context);
      results.push(result);
    } catch (error) {
      logger.error('Error creating bulk subtask:', error);
      results.push({ error: error instanceof Error ? error.message : String(error) });
    }
  }
  
  return {
    subtasks: results,
    totalCreated: results.filter(r => !('error' in r)).length,
    totalFailed: results.filter(r => 'error' in r).length,
    parentKey: params.parentKey,
    success: results.some(r => !('error' in r))
  };
}

export const registerCreateBulkSubtasksTool = (server: McpServer) => {
  server.tool(
    'createBulkSubtasks',
    `[DEPRECATED] Use multiple 'createIssue' calls instead

MIGRATION:
OLD: createBulkSubtasks({parentKey, subtasks: [...] })
NEW: Multiple createIssue({projectKey, parentKey, summary, ...}) calls

This tool will be removed in v4.0.0. For bulk operations:
• Use multiple createIssue calls with parentKey parameter
• Each call auto-detects Sub-task type from parentKey
• Better error handling per subtask
• More flexible parameter control per subtask

See createIssue tool for complete usage patterns.`,
    createBulkSubtasksSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await createBulkSubtasksFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in createBulkSubtasks facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error creating bulk subtasks: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 4. getEpic → getIssue facade
// ========================================
export const getEpicSchema = z.object({
  epicKey: z.string().describe('Epic key'),
  includeIssues: z.boolean().optional().describe('Include child issues'),
  fields: z.string().optional().describe('Fields to include')
});

async function getEpicFacadeImpl(params: any, context: any) {
  showDeprecationWarning('getEpic', 'getIssue({issueKey: epicKey}) // Enhanced with Epic-specific details');
  
  // Map to enhanced getIssue with Epic-specific expansion
  const enhancedParams = {
    issueKey: params.epicKey,
    includeEpicDetails: true,
    includeStoryDetails: false,
    includeSubtaskDetails: false,
    includeHierarchy: params.includeIssues || false,
    includeProgress: true,
    includeTransitions: false,
    includeComments: false,
    includeHistory: false,
    includeAttachments: false,
    autoExpand: true,
    customFields: params.fields ? [params.fields] : undefined
  };
  
  return enhancedGetIssueImpl(enhancedParams, context);
}

export const registerGetEpicTool = (server: McpServer) => {
  server.tool(
    'getEpic',
    `[DEPRECATED] Use enhanced 'getIssue' instead

MIGRATION:
OLD: getEpic({epicKey, includeIssues})
NEW: getIssue({issueKey: epicKey}) // Auto-detects and enhances Epic details

This tool will be removed in v4.0.0. The enhanced 'getIssue' provides:
• Automatic Epic type detection and enhancement
• Better child issue handling with hierarchy
• Consistent response format across all issue types
• Enhanced Epic-specific metadata and progress

See getIssue tool for complete usage patterns.`,
    getEpicSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await getEpicFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in getEpic facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error getting epic: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 5. updateEpic → updateIssue facade
// ========================================
export const updateEpicSchema = z.object({
  epicKey: z.string().describe('Epic key'),
  summary: z.string().optional().describe('Epic summary'),
  description: z.string().optional().describe('Epic description'),
  epicName: z.string().optional().describe('Epic name'),
  epicColor: z.string().optional().describe('Epic color')
});

async function updateEpicFacadeImpl(params: any, context: any) {
  showDeprecationWarning('updateEpic', 'updateIssue({issueKey: epicKey, ...}) // Enhanced with Epic fields');
  
  // Map to enhanced updateIssue
  const enhancedParams = {
    issueKey: params.epicKey,
    summary: params.summary,
    description: params.description,
    epicName: params.epicName,
    epicColor: params.epicColor,
    validateTransition: false,
    smartFieldMapping: true
  };
  
  return enhancedUpdateIssueImpl(enhancedParams, context);
}

export const registerUpdateEpicTool = (server: McpServer) => {
  server.tool(
    'updateEpic',
    `[DEPRECATED] Use enhanced 'updateIssue' instead

MIGRATION:
OLD: updateEpic({epicKey, summary, epicName})
NEW: updateIssue({issueKey: epicKey, summary, epicName}) // Auto-handles Epic fields

This tool will be removed in v4.0.0. The enhanced 'updateIssue' provides:
• Automatic Epic field handling and validation
• Type-specific field mapping
• Better error handling for Epic constraints
• Consistent update patterns across all issue types

See updateIssue tool for complete usage patterns.`,
    updateEpicSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await updateEpicFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in updateEpic facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error updating epic: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 6. getEpicIssues → searchIssues facade  
// ========================================
export const getEpicIssuesSchema = z.object({
  epicKey: z.string().describe('Epic key'),
  maxResults: z.number().optional().describe('Maximum results'),
  fields: z.string().optional().describe('Fields to include')
});

async function getEpicIssuesFacadeImpl(params: any, context: any) {
  showDeprecationWarning('getEpicIssues', 'searchIssues({jql: "parent = " + epicKey}) // Enhanced with Epic hierarchy');
  
  // Map to enhanced searchIssues with Epic-specific JQL
  const enhancedParams = {
    parentKey: params.epicKey,
    maxResults: params.maxResults || 50,
    startAt: 0,
    fields: params.fields,
    includeHierarchy: true,
    includeProgress: false
  };
  
  return enhancedSearchIssuesImpl(enhancedParams, context);
}

export const registerGetEpicIssuesTool = (server: McpServer) => {
  server.tool(
    'getEpicIssues',
    `[DEPRECATED] Use enhanced 'searchIssues' instead

MIGRATION:
OLD: getEpicIssues({epicKey, maxResults})
NEW: searchIssues({jql: "parent = epicKey", maxResults}) // Enhanced with Epic hierarchy

This tool will be removed in v4.0.0. The enhanced 'searchIssues' provides:
• JQL-based Epic issue searching with better flexibility
• Hierarchy visualization and Epic progress tracking
• Better filtering and sorting options
• Consistent search patterns across all issue relationships

See searchIssues tool for complete usage patterns.`,
    getEpicIssuesSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await getEpicIssuesFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in getEpicIssues facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error getting epic issues: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 7. searchEpics → searchIssues facade
// ========================================
export const searchEpicsSchema = z.object({
  projectKey: z.string().optional().describe('Project key'),
  maxResults: z.number().optional().describe('Maximum results'),
  jql: z.string().optional().describe('Additional JQL filters')
});

async function searchEpicsFacadeImpl(params: any, context: any) {
  showDeprecationWarning('searchEpics', 'searchIssues({issueType: "Epic", projectKey, ...}) // Enhanced Epic search');
  
  // Build Epic-specific JQL
  let jqlParts = ['issueType = Epic'];
  
  if (params.projectKey) {
    jqlParts.push(`project = "${params.projectKey}"`);
  }
  
  if (params.jql) {
    jqlParts.push(`(${params.jql})`);
  }
  
  const enhancedParams = {
    projectKey: params.projectKey,
    issueType: 'Epic',
    jql: params.jql,
    maxResults: params.maxResults || 50,
    startAt: 0,
    includeHierarchy: false,
    includeProgress: true
  };
  
  return enhancedSearchIssuesImpl(enhancedParams, context);
}

export const registerSearchEpicsTool = (server: McpServer) => {
  server.tool(
    'searchEpics',
    `[DEPRECATED] Use enhanced 'searchIssues' instead

MIGRATION:
OLD: searchEpics({projectKey, maxResults})
NEW: searchIssues({jql: "issueType = Epic AND project = projectKey", maxResults})

This tool will be removed in v4.0.0. The enhanced 'searchIssues' provides:
• JQL-based Epic searching with full Jira query power
• Enhanced Epic metadata and progress information
• Better filtering, sorting, and field selection
• Consistent search patterns across all issue types

See searchIssues tool for complete usage patterns.`,
    searchEpicsSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await searchEpicsFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in searchEpics facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error searching epics: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// ========================================
// 8. searchStories → searchIssues facade
// ========================================
export const searchStoriesSchema = z.object({
  projectKey: z.string().optional().describe('Project key'),
  epicKey: z.string().optional().describe('Epic key to search within'),
  maxResults: z.number().optional().describe('Maximum results'),
  jql: z.string().optional().describe('Additional JQL filters')
});

async function searchStoriesFacadeImpl(params: any, context: any) {
  showDeprecationWarning('searchStories', 'searchIssues({issueType: "Story", epicKey, ...}) // Enhanced Story search');
  
  // Build Story-specific JQL
  let jqlParts = ['issueType = Story'];
  
  if (params.projectKey) {
    jqlParts.push(`project = "${params.projectKey}"`);
  }
  
  if (params.epicKey) {
    jqlParts.push(`parent = "${params.epicKey}"`);
  }
  
  if (params.jql) {
    jqlParts.push(`(${params.jql})`);
  }
  
  const enhancedParams = {
    projectKey: params.projectKey,
    issueType: 'Story',
    epicKey: params.epicKey,
    jql: params.jql,
    maxResults: params.maxResults || 50,
    startAt: 0,
    includeHierarchy: true,
    includeProgress: false
  };
  
  return enhancedSearchIssuesImpl(enhancedParams, context);
}

export const registerSearchStoriesTool = (server: McpServer) => {
  server.tool(
    'searchStories',
    `[DEPRECATED] Use enhanced 'searchIssues' instead

MIGRATION:
OLD: searchStories({projectKey, epicKey, maxResults})
NEW: searchIssues({jql: "issueType = Story AND project = projectKey AND parent = epicKey"})

This tool will be removed in v4.0.0. The enhanced 'searchIssues' provides:
• JQL-based Story searching with Epic relationship filtering
• Enhanced hierarchy visualization and Epic progress tracking
• Better filtering, sorting, and field selection
• Consistent search patterns across all issue types

See searchIssues tool for complete usage patterns.`,
    searchStoriesSchema.shape,
    async (params: any, context: any) => {
      try {
        const result = await searchStoriesFacadeImpl(params, context);
        return {
          content: [{
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }]
        };
      } catch (error: any) {
        logger.error('Error in searchStories facade:', error);
        return {
          content: [{
            type: 'text',
            text: `Error searching stories: ${error.message}`
          }],
          isError: true
        };
      }
    }
  );
};

// Export all facade registrations
export const registerAllDeprecatedToolsFacades = (server: McpServer) => {
  registerCreateStoryTool(server);
  registerCreateSubtaskTool(server);
  registerCreateBulkSubtasksTool(server);
  registerGetEpicTool(server);
  registerUpdateEpicTool(server);
  registerGetEpicIssuesTool(server);
  registerSearchEpicsTool(server);
  registerSearchStoriesTool(server);
};