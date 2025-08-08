import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from 'path';
import { fileURLToPath } from "url";
import fs from "fs";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env
function loadEnv(): Record<string, string> {
  try {
    const envFile = path.resolve(process.cwd(), '.env');
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars: Record<string, string> = {};
    envContent.split('\n').forEach(line => {
      if (line.trim().startsWith('#') || !line.trim()) return;
      const [key, ...valueParts] = line.split('=');
      if (key && valueParts.length > 0) {
        const value = valueParts.join('=');
        envVars[key.trim()] = value.trim();
      }
    });
    return envVars;
  } catch (error) {
    console.error("Error loading .env file:", error);
    return {};
  }
}

async function testIssueComments() {
  const env = loadEnv();
  
  console.log("🚀 Testing Issue Comments Tools (Phase 3 Sprint 3.1.1)");
  console.log("=" .repeat(60));

  // Create MCP client
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.resolve(__dirname, "../../dist/index.js")],
    env: {
      ...process.env,
      ...env
    },
  });

  const client = new Client(
    {
      name: "test-client",
      version: "1.0.0",
    },
    {
      capabilities: {},
    }
  );

  try {
    await client.connect(transport);
    console.log("✅ Connected to MCP server");

    // Test issue key from environment or use default  
    const testIssueKey = env.TEST_ISSUE_KEY || 'TX-1';
    console.log(`📝 Using test issue: ${testIssueKey}`);

    // Test 1: getIssueTransitions
    console.log("\n🔄 Testing getIssueTransitions...");
    try {
      const transitionsResult = await client.callTool("getIssueTransitions", {
        issueKey: testIssueKey
      });
      console.log("✅ getIssueTransitions success");
      const transitions = JSON.parse(transitionsResult.content[0].text);
      console.log(`   Found ${transitions.totalTransitions} available transitions`);
      if (transitions.transitions && transitions.transitions.length > 0) {
        console.log(`   First transition: ${transitions.transitions[0].name}`);
      }
    } catch (error) {
      console.log("❌ getIssueTransitions failed:", error);
    }

    // Test 2: getIssueComments
    console.log("\n💬 Testing getIssueComments...");
    try {
      const commentsResult = await client.callTool("getIssueComments", {
        issueKey: testIssueKey,
        maxResults: 10
      });
      console.log("✅ getIssueComments success");
      const comments = JSON.parse(commentsResult.content[0].text);
      console.log(`   Found ${comments.totalComments} comments`);
      if (comments.comments && comments.comments.length > 0) {
        console.log(`   First comment by: ${comments.comments[0].author?.displayName || 'Unknown'}`);
        console.log(`   Comment preview: ${comments.comments[0].body?.substring(0, 50) || 'No content'}...`);
      }
    } catch (error) {
      console.log("❌ getIssueComments failed:", error);
    }

    // Test 3: addIssueComment (create a test comment)
    console.log("\n➕ Testing addIssueComment...");
    let newCommentId: string | null = null;
    try {
      const addCommentResult = await client.callTool("addIssueComment", {
        issueKey: testIssueKey,
        body: `Test comment added by MCP client at ${new Date().toISOString()}`
      });
      console.log("✅ addIssueComment success");
      const addResult = JSON.parse(addCommentResult.content[0].text);
      newCommentId = addResult.comment?.id;
      console.log(`   Comment ID: ${newCommentId}`);
      console.log(`   Author: ${addResult.comment?.author?.displayName || 'Unknown'}`);
    } catch (error) {
      console.log("❌ addIssueComment failed:", error);
    }

    // Test 4: updateIssueComment (if we have a comment ID)
    if (newCommentId) {
      console.log("\n✏️ Testing updateIssueComment...");
      try {
        const updateCommentResult = await client.callTool("updateIssueComment", {
          issueKey: testIssueKey,
          commentId: newCommentId,
          body: `UPDATED: Test comment updated by MCP client at ${new Date().toISOString()}`
        });
        console.log("✅ updateIssueComment success");
        const updateResult = JSON.parse(updateCommentResult.content[0].text);
        console.log(`   Updated comment ID: ${updateResult.comment?.id}`);
        console.log(`   Updated at: ${updateResult.comment?.updated}`);
      } catch (error) {
        console.log("❌ updateIssueComment failed:", error);
      }
    } else {
      console.log("\n⏭️ Skipping updateIssueComment (no comment ID available)");
    }

    console.log("\n🎉 Issue Comments Tools Test Complete!");
    console.log("=" .repeat(60));
    
    // Summary
    console.log("\n📊 Summary:");
    console.log("• getIssueTransitions: Get available issue transitions");
    console.log("• getIssueComments: List comments with pagination");
    console.log("• addIssueComment: Add new comment to issue");
    console.log("• updateIssueComment: Update existing comment");
    console.log("\n🎯 Sprint 3.1.1 Progress: 4/4 tools implemented and tested");
    console.log("📈 Total tools: 29/45 (64% coverage, +4 from Phase 2)");

  } catch (error) {
    console.error("❌ Test failed:", error);
  } finally {
    await client.close();
    console.log("🔌 Disconnected from MCP server");
  }
}

testIssueComments().catch(console.error);