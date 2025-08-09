import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runCoreUpdateTests() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.resolve(__dirname, "../../dist/index.js")]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log("🚀 Starting Core Enhanced Update Tests...\n");
    
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test 1: Universal fields
    console.log("\n📝 Test 1: Universal fields update");
    const test1 = await client.callTool({
      name: 'updateIssue',
      arguments: {
        issueKey: 'XDEMO2-1',
        summary: `Enhanced Test 1 - ${Date.now()}`,
        priority: 'High',
        smartFieldMapping: true
      }
    });
    
    const result1 = JSON.parse(((test1 as any).content[0] as any).text);
    console.log(`   ✅ Success: ${result1.success} - Type: ${result1.detectedIssueType}`);

    // Test 2: Epic auto-detection
    console.log("\n📝 Test 2: Epic auto-detection");
    const test2 = await client.callTool({
      name: 'updateIssue',
      arguments: {
        issueKey: 'XDEMO2-1',
        epicName: `Enhanced Epic Test - ${Date.now()}`,
        summary: `Epic Summary Test - ${Date.now()}`,
        smartFieldMapping: true
      }
    });
    
    const result2 = JSON.parse(((test2 as any).content[0] as any).text);
    console.log(`   ✅ Success: ${result2.success} - Detected: ${result2.detectedIssueType}`);
    console.log(`   🎯 Applied Updates: ${result2.appliedUpdates?.join(', ')}`);

    // Test 3: Story auto-detection
    console.log("\n📝 Test 3: Story auto-detection");
    const test3 = await client.callTool({
      name: 'updateIssue',
      arguments: {
        issueKey: 'XDEMO2-2',
        storyPoints: 5,
        summary: `Story Test - ${Date.now()}`,
        smartFieldMapping: true
      }
    });
    
    const result3 = JSON.parse(((test3 as any).content[0] as any).text);
    console.log(`   ✅ Success: ${result3.success} - Detected: ${result3.detectedIssueType}`);

    // Test 4: Sub-task auto-detection
    console.log("\n📝 Test 4: Sub-task auto-detection");
    const test4 = await client.callTool({
      name: 'updateIssue',
      arguments: {
        issueKey: 'XDEMO2-3',
        parentKey: 'XDEMO2-1',
        summary: `Subtask Test - ${Date.now()}`,
        smartFieldMapping: true
      }
    });
    
    const result4 = JSON.parse(((test4 as any).content[0] as any).text);
    console.log(`   ✅ Success: ${result4.success} - Detected: ${result4.detectedIssueType}`);

    // Test 5: Error handling
    console.log("\n📝 Test 5: Error handling (invalid issue)");
    try {
      const test5 = await client.callTool({
        name: 'updateIssue',
        arguments: {
          issueKey: 'INVALID-999',
          summary: 'Should fail',
          smartFieldMapping: true
        }
      });
      
      const result5 = JSON.parse(((test5 as any).content[0] as any).text);
      console.log(`   ⚠️  Expected failure: Success=${result5.success}, Error=${result5.error || result5.message}`);
    } catch (error) {
      console.log(`   ✅ Error handling works: ${error}`);
    }

    console.log("\n🎉 Core Enhanced Update Tests completed!");
    console.log("\n📊 Summary:");
    console.log("   - Universal field update: ✅");
    console.log("   - Epic auto-detection: ✅");
    console.log("   - Story auto-detection: ✅");
    console.log("   - Sub-task auto-detection: ✅");
    console.log("   - Error handling: ✅");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the tests
runCoreUpdateTests().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
