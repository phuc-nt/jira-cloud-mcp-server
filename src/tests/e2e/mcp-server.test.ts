import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import { McpClient } from '@modelcontextprotocol/sdk/client/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { InMemoryClientServerPair } from '@modelcontextprotocol/sdk/server/memory.js';
import { AtlassianConfig } from '../../utils/atlassian-api-base.js';
import { registerCreateIssueTool } from '../../tools/jira/create-issue.js';
import { registerCreateFilterTool } from '../../tools/jira/create-filter.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

describe('MCP Server E2E Tests - Jira Tools Only', () => {
  let server: McpServer;
  let client: McpClient;
  let testConfig: AtlassianConfig;

  beforeEach(async () => {
    // Setup test configuration from environment variables
    const ATLASSIAN_SITE_NAME = process.env.ATLASSIAN_SITE_NAME || 'test-site';
    const ATLASSIAN_USER_EMAIL = process.env.ATLASSIAN_USER_EMAIL || 'test@example.com';
    const ATLASSIAN_API_TOKEN = process.env.ATLASSIAN_API_TOKEN || 'test-token';

    testConfig = {
      baseUrl: ATLASSIAN_SITE_NAME.includes('.atlassian.net') 
        ? `https://${ATLASSIAN_SITE_NAME}` 
        : ATLASSIAN_SITE_NAME,
      email: ATLASSIAN_USER_EMAIL,
      apiToken: ATLASSIAN_API_TOKEN
    };

    // Create server-client pair for testing
    const pair = new InMemoryClientServerPair();
    server = new McpServer({
      name: 'mcp-jira-test-server',
      version: '3.0.0',
      capabilities: {
        tools: {}  // Tools-only capability
      }
    });
    client = new McpClient();

    // Connect server and client
    await server.connect(pair.serverTransport);
    await client.connect(pair.clientTransport);

    // Create server wrapper with context injection
    const serverWithContext = {
      tool: (name: string, description: string, schema: any, handler: any) => {
        server.tool(name, description, schema, async (params: any, context: any) => {
          context.atlassianConfig = testConfig;
          return await handler(params, context);
        });
      }
    };
    
    // Register some tools for testing (using existing ones)
    registerCreateIssueTool(serverWithContext);
    registerCreateFilterTool(serverWithContext);
  });

  afterEach(() => {
    // Close connections after each test
    server.close();
    client.close();
  });

  test('Server should initialize with tools-only capability', async () => {
    // Get server capabilities
    const capabilities = await client.getServerCapabilities();
    
    // Check that server has tools capability
    expect(capabilities.tools).toBeDefined();
    
    // Check that server does NOT have resources capability  
    expect(capabilities.resources).toBeUndefined();
  });

  test('Server should register Jira tools correctly', async () => {
    // Get list of registered tools
    const tools = await client.listTools();
    
    // Check that tools are registered
    expect(tools.tools.length).toBeGreaterThan(0);
    
    // Check for specific Jira tools
    const toolNames = tools.tools.map(tool => tool.name);
    expect(toolNames).toContain('createIssue');
    expect(toolNames).toContain('createFilter');
  });

  test('Tools should have proper schema definition', async () => {
    const tools = await client.listTools();
    const createIssueTool = tools.tools.find(tool => tool.name === 'createIssue');
    
    expect(createIssueTool).toBeDefined();
    expect(createIssueTool?.inputSchema).toBeDefined();
    expect(createIssueTool?.description).toContain('Create a new Jira issue');
  });

  // TODO: Add integration tests when ready for live API testing
  test.todo('Should call createIssue tool successfully');
  test.todo('Should handle API errors properly');
  test.todo('Should validate tool parameters correctly');
}); 