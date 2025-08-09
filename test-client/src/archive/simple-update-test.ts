import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function simpleUpdateTest() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.resolve(__dirname, "../../dist/index.js")]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log("🚀 Starting Simple Enhanced Update Test...\n");
    
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Simple universal field update test
    console.log("\n📝 Test: Update summary only");
    const response = await client.callTool({
      name: 'updateIssue',
      arguments: {
        issueKey: 'XDEMO2-1',
        summary: `Updated Summary - ${Date.now()}`,
        smartFieldMapping: true
      }
    });

    const result = JSON.parse(((response as any).content[0] as any).text);
    
    console.log("📋 Result:");
    console.log(`   - Issue: ${result.issueKey}`);
    console.log(`   - Detected Type: ${result.detectedIssueType}`);
    console.log(`   - Success: ${result.success}`);
    console.log(`   - Applied Updates: ${result.appliedUpdates?.join(', ') || 'None'}`);
    
    if (!result.success) {
      console.log(`   - Error: ${result.error || result.message}`);
    }

    console.log("\n🎉 Simple test completed!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the test
simpleUpdateTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
