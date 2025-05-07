import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
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

async function main() {
  try {
    console.log("=== MCP Atlassian Tool Test ===");
    console.log("Testing all tools in dev_mcp-server-atlassian\n");

    const envVars = loadEnv();
    const client = new Client({ name: "mcp-atlassian-test-client", version: "1.0.0" });
    const serverPath = path.resolve(process.cwd(), "../dist/index.js");
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
      }
    });
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
      env: {
        ...processEnv,
        ...envVars
      }
    });
    console.log("Connecting to MCP server...");
    await client.connect(transport);
    // List available tools
    console.log("\n=== Available Tools ===");
    const toolsResult = await client.listTools();
    const tools = toolsResult.tools.map(tool => tool.name);
    console.log("Tools:", tools.join(", "));
    // Test each tool (callTool)
    console.log("\n=== Testing Tools ===");
    // 1. createIssue
    const newIssueSummary = `Test Issue ${new Date().toLocaleString()}`;
    const createIssueResult = await client.callTool({
      name: "createIssue",
      arguments: {
        projectKey: "XDEMO2",
        summary: newIssueSummary,
        description: "Test issue created by MCP tool-test",
        issueType: "Task"
      }
    });
    console.log("createIssue - Success:", createIssueResult.key ? "✅" : "❌", "Key:", createIssueResult.key || "Unknown");
    const newIssueKey = createIssueResult.key;
    // 2. updateIssue
    if (newIssueKey) {
      const updateIssueResult = await client.callTool({
        name: "updateIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          summary: `${newIssueSummary} (Updated)`
        }
      });
      console.log("updateIssue - Success:", updateIssueResult.success ? "✅" : "❌");
    }
    // 3. assignIssue
    if (newIssueKey) {
      const assignIssueResult = await client.callTool({
        name: "assignIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          accountId: ""
        }
      });
      console.log("assignIssue - Success:", assignIssueResult.success ? "✅" : "❌");
    }
    // 4. transitionIssue
    if (newIssueKey) {
      const transitionIssueResult = await client.callTool({
        name: "transitionIssue",
        arguments: {
          issueIdOrKey: newIssueKey,
          transitionId: "11",
          comment: "Test transition"
        }
      });
      console.log("transitionIssue - Success:", transitionIssueResult.success ? "✅" : "❌");
    }
    // 5. createPage
    const newPageTitle = `Test Page ${new Date().toLocaleString()}`;
    const createPageResult = await client.callTool({
      name: "createPage",
      arguments: {
        spaceKey: "TX",
        title: newPageTitle,
        content: "<p>This is a test page created by MCP tool-test</p>"
      }
    });
    console.log("createPage - Success:", createPageResult.id ? "✅" : "❌", "ID:", createPageResult.id || "Unknown");
    const newPageId = createPageResult.id;
    // 6. updatePage
    if (newPageId) {
      const updatePageResult = await client.callTool({
        name: "updatePage",
        arguments: {
          pageId: newPageId,
          title: `${newPageTitle} (Updated)`,
          content: "<p>This page has been updated by MCP tool-test</p>",
          version: 1,
          addLabels: ["test", "mcp-client"]
        }
      });
      console.log("updatePage - Success:", updatePageResult.success ? "✅" : "❌");
    }
    // 7. addComment
    if (newPageId) {
      const addCommentResult = await client.callTool({
        name: "addComment",
        arguments: {
          pageId: newPageId,
          content: "<p>This is a test comment added by MCP tool-test</p>"
        }
      });
      console.log("addComment - Success:", addCommentResult.commentId ? "✅" : "❌");
    }
    // Summary
    console.log("\n=== Tool Test Summary ===");
    console.log("All tools have been tested!");
    // Close connection
    console.log("\nClosing connection...");
    await client.close();
    console.log("Connection closed successfully");
  } catch (error) {
    console.error("Error:", error);
  }
}

main(); 