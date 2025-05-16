# MCP Server: Tools and Resources Development Guide

This document provides detailed instructions on developing resources and tools for the Model Context Protocol (MCP) Server. It focuses on practical implementation approaches with real-world examples from the Atlassian MCP Server codebase.

## 1. Introduction to MCP Resources and Tools

In the MCP protocol, there are two primary ways for AI models to interact with external systems:

- **Resources**: Read-only endpoints that retrieve data (GET operations)
- **Tools**: Action-oriented endpoints that modify data or perform operations (POST/PUT/DELETE operations)

This guide will walk you through the implementation details of both, with emphasis on code organization, best practices, and real examples from the Atlassian MCP Server.

## 2. Understanding MCP Resources

### 2.1. What are MCP Resources?

Resources in MCP are addressable endpoints that return data about specific entities. They:

- Have unique URI patterns (e.g., `jira://issues`, `confluence://pages/{pageId}`)
- Support query parameters for filtering and pagination
- Return data in a consistent, schema-validated format
- Are read-only (they don't modify data)

### 2.2. Resource Directory Structure

In the Atlassian MCP Server, resources are organized by product and entity type:

```
/src
  /resources
    /jira
      issues.ts              # Jira issue resources
      projects.ts            # Jira project resources
      boards.ts              # Jira board resources
      ...
    /confluence
      spaces.ts              # Confluence space resources
      pages.ts               # Confluence page resources
      ...
    index.ts                 # Main resource registration
```

## 3. Implementing MCP Resources

### 3.1. Creating a New Resource

To create a new resource, follow these steps:

1. Create a new file in the appropriate directory (e.g., `src/resources/jira/your-resource.ts`)
2. Define the resource template and handler
3. Register the resource with a unique name
4. Update the resource registration in the index file

### 3.2. Resource File Structure

A standard resource file includes:

```typescript
// Import necessary libraries
import { McpServer, ResourceTemplate } from '@modelcontextprotocol/sdk/server/mcp.js';
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
// Import schemas and API helpers
import { yourSchema } from '../../schemas/your-schema.js';
import { yourApiFunction } from '../../utils/your-api-function.js';

// Initialize logger
const logger = Logger.getLogger('YourResource');

// Function to get Atlassian config from environment 
// (Important: each resource file should have its own function)
function getAtlassianConfigFromEnv(): AtlassianConfig {
  const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || '';
  const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || '';
  const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || '';

  if (!ATLASSIAN_SITE_NAME || !ATLASSIAN_USER_EMAIL || !ATLASSIAN_API_TOKEN) {
    throw new Error('Missing Atlassian credentials in environment variables');
  }

  return {
    baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
      ? `https://${ATLASSIAN_SITE_NAME}` 
      : ATLASSIAN_SITE_NAME,
    email: ATLASSIAN_USER_EMAIL,
    apiToken: ATLASSIAN_API_TOKEN
  };
}

// Function to register the resource with MCP Server
export function registerYourResource(server: McpServer) {
  logger.info('Registering Your Resource...');

  server.resource(
    'your-resource-name',  // Unique name for the resource
    new ResourceTemplate('your://resource/pattern/{param}', {  // URI pattern with parameters
      list: async (_extra) => ({
        resources: [
          {
            uri: 'your://resource/pattern/{param}',
            name: 'Your Resource Name',
            description: 'Description of your resource',
            mimeType: 'application/json'
          }
        ]
      })
    }),
    async (uri, params, _extra) => {
      try {
        // Get config from environment
        const config = getAtlassianConfigFromEnv();
        
        // Process parameters from URI
        const param = Array.isArray(params.param) ? params.param[0] : params.param;
        
        // Call Atlassian API
        const data = await yourApiFunction(config, param);
        
        // Format URI string
        const uriString = typeof uri === 'string' ? uri : uri.href;
        
        // Return result in MCP format
        return {
          contents: [{
            uri: uriString,
            mimeType: 'application/json',
            text: JSON.stringify({
              yourData: data,
              metadata: { 
                self: uriString,
                // Add other metadata if needed
              }
            })
          }]
        };
      } catch (error) {
        logger.error(`Error processing resource request:`, error);
        throw error;
      }
    }
  );

  logger.info('Your Resource registered successfully');
}
```

### 3.3. Real Example: Jira Issues Resource

Here's a real example from the [`src/resources/jira/issues.ts`](../src/resources/jira/issues.ts) file:

```typescript
// Excerpt from src/resources/jira/issues.ts
server.resource(
  'jira-issues-list',
  new ResourceTemplate('jira://issues', {
    list: async (_extra) => ({
      resources: [
        {
          uri: 'jira://issues',
          name: 'Jira Issues',
          description: 'List and search all Jira issues',
          mimeType: 'application/json'
        }
      ]
    })
  }),
  async (uri, params, _extra) => {
    try {
      // Get config from environment
      const config = getAtlassianConfigFromEnv();
      
      // Process parameters
      const { limit, offset } = extractPagingParams(params);
      const jql = params?.jql ? (Array.isArray(params.jql) ? params.jql[0] : params.jql) : '';
      
      // Call Jira API
      const response = await searchIssues(config, jql, offset, limit);
      
      // Format and return results
      const uriString = typeof uri === 'string' ? uri : uri.href;
      return createStandardResource(
        uriString,
        response.issues || [],
        'issues',
        issueListSchema,
        response.total || 0,
        limit,
        offset,
        `${config.baseUrl}/issues/`
      );
    } catch (error) {
      logger.error('Error getting issue list:', error);
      throw error;
    }
  }
);
```

### 3.4. Resource Registration

After creating a resource file, register it in the appropriate index file:

```typescript
// In src/resources/jira/index.ts
import { registerYourResource } from './your-resource.js';

export function registerJiraResources(server: McpServer) {
  // Register other resources...
  registerYourResource(server);
}

// In src/resources/index.ts (if not using a product-specific index)
import { registerYourResource } from './your-resource.js';

export function registerAllResources(server: McpServer) {
  // Register other resources...
  registerYourResource(server);
}
```

### 3.5. Resource URI Patterns

Design your resource URI patterns to be:

- **Predictable**: Follow consistent naming conventions
- **Hierarchical**: Reflect parent-child relationships
- **RESTful**: Follow RESTful resource naming principles
- **Queryable**: Support query parameters for filtering

Examples of well-designed URI patterns:

- `jira://issues` - List all issues
- `jira://issues/{issueKey}` - Get a specific issue
- `jira://projects/{projectKey}/issues` - List issues in a project
- `confluence://spaces/{spaceKey}/pages` - List pages in a space

### 3.6. Resource Response Format

Resources should return data in a consistent format:

```json
{
  "yourData": [
    {
      "id": "123",
      "name": "Example Item",
      "properties": {
        "key1": "value1",
        "key2": "value2"
      }
    }
  ],
  "metadata": {
    "self": "your://resource/pattern/param",
    "totalResults": 100,
    "startAt": 0,
    "maxResults": 50
  }
}
```

The `metadata` section typically includes:
- `self`: The URI of the resource
- Pagination info (`totalResults`, `startAt`, `maxResults`)
- Other metadata like API version, timestamp, etc.

## 4. Understanding MCP Tools

### 4.1. What are MCP Tools?

Tools in MCP are function-like endpoints that perform actions. They:

- Have a unique name (e.g., `createIssue`, `updatePage`)
- Accept parameters for the action
- Validate inputs against a schema
- Perform state changes (create, update, delete)
- Return results of the operation

### 4.2. Tool Directory Structure

In the Atlassian MCP Server, tools are organized by product and functionality:

```
/src
  /tools
    /jira
      create-issue.ts        # Tool to create Jira issues
      update-issue.ts        # Tool to update Jira issues
      ...
    /confluence
      create-page.ts         # Tool to create Confluence pages
      update-page.ts         # Tool to update Confluence pages
      ...
    index.ts                 # Main tool registration
```

## 5. Implementing MCP Tools

### 5.1. Creating a New Tool

To create a new tool, follow these steps:

1. Create a new file in the appropriate directory (e.g., `src/tools/jira/your-tool.ts`)
2. Define the tool schema and handler
3. Register the tool with a unique name
4. Update the tool registration in the index file

### 5.2. Tool File Structure

A standard tool file includes:

```typescript
// Import necessary libraries
import { Logger } from '../../utils/logger.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
// Import API helpers
import { yourToolApiFunction } from '../../utils/your-tool-api.js';

// Initialize logger
const logger = Logger.getLogger('YourTool');

// Input schema for the tool
const YOUR_TOOL_SCHEMA = {
  type: 'object',
  properties: {
    param1: { 
      type: 'string', 
      description: 'Description for parameter 1' 
    },
    param2: { 
      type: 'number', 
      description: 'Description for parameter 2' 
    }
    // Add other parameters...
  },
  required: ['param1'] // Required parameters
};

// Function to register the tool
export function registerYourTool(server: any) {
  logger.info('Registering Your Tool...');

  server.tool(
    'your-tool-name',  // Tool name
    'Description of what your tool does', // Tool description
    YOUR_TOOL_SCHEMA, // Input schema
    async (params: any, context: any) => {
      try {
        // Get config from context
        const { atlassianConfig } = context;
        
        // Process parameters
        const { param1, param2 } = params;
        
        // Call Atlassian API
        const result = await yourToolApiFunction(atlassianConfig, param1, param2);
        
        // Return result in MCP format
        return {
          content: [
            { type: 'text', text: `Operation completed successfully: ${result.id}` }
          ]
        };
      } catch (error) {
        logger.error(`Error executing tool:`, error);
        return {
          content: [{ type: 'text', text: `Error: ${error.message}` }],
          isError: true
        };
      }
    }
  );

  logger.info('Your Tool registered successfully');
}
```

### 5.3. Real Example: Create Issue Tool

Here's a real example from the [`src/tools/jira/create-issue.ts`](../src/tools/jira/create-issue.ts) file:

```typescript
// Excerpt from src/tools/jira/create-issue.ts
server.tool(
  'createIssue',
  'Create a new issue in Jira',
  {
    type: 'object',
    properties: {
      projectKey: { type: 'string', description: 'Project key (e.g., PROJ)' },
      summary: { type: 'string', description: 'Issue title/summary' },
      description: { type: 'string', description: 'Issue description' },
      issueType: { type: 'string', description: 'Issue type (e.g., "Task", "Bug")' },
      // Other parameters...
    },
    required: ['projectKey', 'summary', 'issueType']
  },
  async (params, context) => {
    try {
      const { atlassianConfig } = context;
      
      // Prepare data
      const issueData = {
        fields: {
          project: { key: params.projectKey },
          summary: params.summary,
          description: params.description,
          issuetype: { name: params.issueType }
          // Other fields...
        }
      };
      
      // Call Jira API
      const result = await createJiraIssue(atlassianConfig, issueData);
      
      // Return result
      return {
        content: [
          {
            type: 'text',
            text: `Successfully created issue ${result.key}: ${params.summary}`
          }
        ]
      };
    } catch (error) {
      logger.error(`Error creating Jira issue:`, error);
      return {
        content: [{ type: 'text', text: `Error creating issue: ${error.message}` }],
        isError: true
      };
    }
  }
);
```

### 5.4. Tool Registration

After creating a tool file, register it in the tools index file:

```typescript
// In src/tools/index.ts
import { registerYourTool } from './jira/your-tool.js';
// or
import { registerYourTool } from './confluence/your-tool.js';

export function registerAllTools(server: any) {
  // Register other tools...
  registerYourTool(server);
}
```

### 5.5. Tool Input Schemas

Tool input schemas are critical for validation and documentation. A well-designed schema:

- Clearly describes each parameter
- Marks required vs. optional parameters
- Provides default values where appropriate
- Includes type information and constraints
- Has helpful descriptions for AI models

Example of a good tool schema:

```typescript
{
  type: 'object',
  properties: {
    projectKey: { 
      type: 'string', 
      description: 'The project key (e.g., "PROJ")'
    },
    summary: { 
      type: 'string', 
      description: 'Brief summary of the issue'
    },
    description: { 
      type: 'string', 
      description: 'Detailed description of the issue',
      nullable: true 
    },
    issueType: { 
      type: 'string', 
      description: 'Type of issue to create',
      enum: ['Bug', 'Task', 'Story', 'Epic'],
      default: 'Task'
    },
    priority: { 
      type: 'string', 
      description: 'Issue priority',
      enum: ['Highest', 'High', 'Medium', 'Low', 'Lowest'],
      nullable: true 
    }
  },
  required: ['projectKey', 'summary', 'issueType'],
  additionalProperties: false
}
```

### 5.6. Tool Response Format

Tools should return results in a consistent format:

```typescript
{
  content: [
    { type: 'text', text: 'Operation description' },
    { type: 'text', text: 'Additional information' }
  ],
  // For errors:
  isError: true // Only include for errors
}
```

The `content` array can include multiple text blocks to structure the response.

## 6. API Integration Layer

### 6.1. Creating API Helper Functions

API helper functions are created in utility files to:
- Encapsulate API call logic
- Handle common error patterns
- Format requests consistently
- Parse responses

Example of creating an API helper function:

```typescript
// In src/utils/jira-resource-api.ts or src/utils/jira-tool-api-v3.ts
export async function getJiraIssuesByJql(
  config: AtlassianConfig, 
  jql: string, 
  startAt: number = 0, 
  maxResults: number = 50
): Promise<any> {
  const url = `${config.baseUrl}/rest/api/3/search`;
  
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${Buffer.from(`${config.email}:${config.apiToken}`).toString('base64')}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      jql,
      startAt,
      maxResults,
      fields: ['summary', 'description', 'status', 'assignee', 'reporter', 'priority', 'created', 'updated', 'issuetype', 'project']
    })
  });
  
  if (!response.ok) {
    throw new Error(`Jira API error: ${response.status} ${await response.text()}`);
  }
  
  return await response.json();
}
```

### 6.2. Data Transformation

Data transformation functions convert between Atlassian API data and MCP format:

```typescript
// Example of a transformation function
function transformJiraIssueToMcpFormat(jiraIssue: any): any {
  return {
    id: jiraIssue.id,
    key: jiraIssue.key,
    summary: jiraIssue.fields.summary,
    description: jiraIssue.fields.description,
    status: {
      id: jiraIssue.fields.status.id,
      name: jiraIssue.fields.status.name,
      category: jiraIssue.fields.status.statusCategory.name
    },
    issueType: {
      id: jiraIssue.fields.issuetype.id,
      name: jiraIssue.fields.issuetype.name
    },
    projectKey: jiraIssue.fields.project.key,
    created: jiraIssue.fields.created,
    updated: jiraIssue.fields.updated,
    // Transform other fields as needed
  };
}
```

### 6.3. Schema Definitions

Define schemas in dedicated files:

```typescript
// In src/schemas/jira.ts
export const issueSchema = {
  type: 'object',
  properties: {
    id: { type: 'string', description: 'Issue ID' },
    key: { type: 'string', description: 'Issue key (e.g., PROJ-123)' },
    // Other properties
  },
  required: ['id', 'key', 'summary', 'status']
};

export const issueListSchema = {
  type: 'array',
  items: issueSchema
};
```

## 7. Testing and Debugging

### 7.1. Using the Test Client

The MCP Server comes with a test client in `dev_mcp-atlassian-test-client`:

```bash
# List all registered resources and tools
cd dev_mcp-atlassian-test-client
npx ts-node --esm src/list-mcp-inventory.ts

# Test specific resources
npx ts-node --esm src/test-jira-issues.ts
npx ts-node --esm src/test-confluence-pages.ts
```

### 7.2. Creating Custom Test Scripts

You can create custom test scripts for your resources and tools:

```typescript
// Example test script in dev_mcp-atlassian-test-client/src/test-your-resource.ts
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';

async function main() {
  console.log('Testing your resource...');
  
  // Connect to MCP server
  const client = new McpClient('http://localhost:3000');
  await client.connect();
  
  // Test resource
  try {
    const result = await client.fetch('your://resource/pattern/param');
    console.log('Resource result:', JSON.parse(result.contents[0].text));
  } catch (error) {
    console.error('Error testing resource:', error);
  }
  
  // Test tool
  try {
    const result = await client.invoke('your-tool-name', {
      param1: 'value1',
      param2: 123
    });
    console.log('Tool result:', result);
  } catch (error) {
    console.error('Error testing tool:', error);
  }
}

main().catch(console.error);
```

### 7.3. Logging

Use the logger for effective debugging:

```typescript
import { Logger } from '../../utils/logger.js';
const logger = Logger.getLogger('YourComponent');

// Log levels
logger.debug('Detailed debug info');
logger.info('General info');
logger.warn('Warning');
logger.error('Error message', error);
```

## 8. Best Practices

### 8.1. Code Organization

1. **Single responsibility**: Keep each resource/tool in its own file
2. **Consistent naming**: Use clear naming conventions
3. **Functional organization**: Group by product and functionality

### 8.2. Error Handling

1. **Catch and log errors**: Always catch errors and log details
2. **Helpful error messages**: Return clear error messages
3. **Error differentiation**: Distinguish between MCP, Atlassian API, and internal errors

### 8.3. Avoiding Resource Duplication

1. **Unique resource names**: Ensure each resource has a unique name
2. **Single URI pattern registration**: Register each URI pattern only once
3. **Verification**: Test registrations with the client

### 8.4. Schema and Validation

1. **Clear schemas**: Define detailed schemas for input/output
2. **Parameter validation**: Validate parameters before API calls
3. **Consistent format**: Ensure consistent data format

## 9. Common Pitfalls and Solutions

### 9.1. Resource Registration Issues

**Problem**: Resources not appearing in the inventory
**Solution**:
- Ensure unique resource names
- Verify resource registration in index files
- Check list callback returns correct resources

### 9.2. Authentication Problems

**Problem**: API calls failing with authentication errors
**Solution**:
- Check environment variables
- Verify token permissions
- Check for API format changes

### 9.3. Data Formatting Issues

**Problem**: Resource returning malformed data
**Solution**:
- Validate response data
- Check transformation functions
- Ensure proper error handling

### 9.4. Tool Execution Failures

**Problem**: Tools failing to complete actions
**Solution**:
- Verify input parameter validation
- Check error handling
- Test API calls separately

## 10. Working with Special Data Types

### 10.1. Atlassian Document Format (ADF)

When working with rich text in Atlassian, you'll encounter ADF:

```typescript
// Example of handling ADF in resource transformers
function handleDescription(description: any): string | object {
  if (!description) return null;
  
  // If it's already plain text
  if (typeof description === 'string') return description;
  
  // If it's ADF
  if (description.content && description.version) {
    // Return entire ADF object
    return description;
    
    // Alternatively, extract plain text if needed:
    // return extractPlainTextFromADF(description);
  }
  
  return null;
}

// Example transformer for ADF
function extractPlainTextFromADF(adf: any): string {
  if (!adf || !adf.content) return '';
  
  // Recursively extract text
  let text = '';
  
  function extractText(nodes: any[]) {
    if (!nodes || !Array.isArray(nodes)) return;
    
    for (const node of nodes) {
      if (node.type === 'text' && node.text) {
        text += node.text;
      }
      
      if (node.content) {
        extractText(node.content);
      }
      
      // Add spaces between paragraphs
      if (node.type === 'paragraph') {
        text += '\n';
      }
    }
  }
  
  extractText(adf.content);
  return text;
}
```

### 10.2. Pagination and Large Datasets

Handle pagination for large datasets:

```typescript
// Example of paginated resource fetch
async function fetchAllItems(config: AtlassianConfig, uri: string, params: any): Promise<any[]> {
  let allItems = [];
  let startAt = 0;
  const maxResults = 50;
  let total = 0;
  
  do {
    const response = await fetchPage(config, uri, {
      ...params,
      startAt,
      maxResults
    });
    
    allItems = [...allItems, ...response.items];
    total = response.total;
    startAt += maxResults;
  } while (startAt < total);
  
  return allItems;
}
```

## 11. Next Steps

After understanding how to implement resources and tools:

1. Study the MCP Protocol specifications for advanced features
2. Learn about prompting and AI integration in [03-mcp-prompts-sampling.md](03-mcp-prompts-sampling.md)
3. Explore creating resources/tools for other Atlassian products
4. Contribute improvements to the existing codebase

## 12. References

- [MCP Protocol Documentation](https://github.com/modelcontextprotocol/mcp)
- [Atlassian API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [Resources & Tools Reference](../introduction/resources-and-tools.md)
- [MCP Server Architecture Overview](01-mcp-overview-architecture.md)

---

*Last updated: May 2025* 