import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";
import { TestEnhancedUpdateIssue } from './test-enhanced-update-issue.js';

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function runEnhancedUpdateIssueTest() {
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.resolve(__dirname, "../../dist/index.js")]
  });

  const client = new Client(
    { name: "test-client", version: "1.0.0" },
    { capabilities: {} }
  );

  try {
    console.log("🚀 Starting Enhanced Update Issue Tool Test...\n");
    
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Run enhanced update issue tests
    const testSuite = new TestEnhancedUpdateIssue(client);
    await testSuite.runAllTests();

    console.log("\n🎉 Enhanced Update Issue Test completed successfully!");

  } catch (error) {
    console.error("❌ Test failed:", error);
    process.exit(1);
  } finally {
    await client.close();
  }
}

// Run the test
runEnhancedUpdateIssueTest().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
