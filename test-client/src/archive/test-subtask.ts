import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function testSubtaskCreation() {
  // Create MCP client
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "../dist/index.js")]
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );

  try {
    await client.connect(transport);
    console.log('Connected to MCP server');

    // Test Sub-task creation using existing story XDEMO2-147
    console.log('\n=== Sub-task Creation Test (auto-detect from parentKey) ===');
    const subtaskResult = await client.callTool({
      name: "createIssue",
      arguments: {
        projectKey: 'XDEMO2',
        summary: 'Test Login Form Validation Sub-task',
        parentKey: 'XDEMO2-147', // Link to existing story
        description: 'Sub-task for testing auto-detection from parentKey parameter'
      }
    });
    console.log('Sub-task creation result:', JSON.stringify(subtaskResult, null, 2));

    // Test another Sub-task
    console.log('\n=== Second Sub-task Creation Test ===');
    const subtask2Result = await client.callTool({
      name: "createIssue",
      arguments: {
        projectKey: 'XDEMO2',
        summary: 'Test Login Button Styling Sub-task',
        parentKey: 'XDEMO2-147', // Same parent story
        description: 'Another Sub-task for UI testing'
      }
    });
    console.log('Sub-task 2 creation result:', JSON.stringify(subtask2Result, null, 2));

    console.log('\n🎉 Sub-task creation tests completed!');

  } catch (error) {
    console.error('Sub-task test failed:', error);
  } finally {
    await client.close();
  }
}

testSubtaskCreation();
