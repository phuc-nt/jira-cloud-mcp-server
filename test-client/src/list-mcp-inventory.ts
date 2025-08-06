import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import { fileURLToPath } from "url";

// Get current file path
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function main() {
  const client = new Client({ name: "mcp-atlassian-inventory-list", version: "1.0.0" });
  const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: process.env as Record<string, string>
  });

  console.log("Connecting to MCP server...");
  await client.connect(transport);

  // List available tools with details
  console.log("\n=== Available Tools ===");
  const toolsResult = await client.listTools();
  console.log(`Total tools: ${toolsResult.tools.length}`);
  toolsResult.tools.forEach((tool, index) => {
    console.log(`${index + 1}. ${tool.name}: ${tool.description || 'No description'}`);
  });

  // List available resources
  console.log("\n=== Available Resources ===");
  let resourcesResult: any = { resources: [] };
  try {
    resourcesResult = await client.listResources();
    console.log(`Total resources: ${resourcesResult.resources.length}`);
    resourcesResult.resources.forEach((resource: any, index: number) => {
      console.log(`${index + 1}. ${resource.uriPattern || resource.uri}: ${resource.description || 'No description'}`);
    });
    if (resourcesResult.resources.length === 0) {
      console.warn("WARNING: No resources returned by listResources. This may indicate missing list callbacks in the MCP server resource registration.");
      console.warn("Try these common resource URIs manually:");
      [
        'jira://issues',
        'jira://projects',
        'jira://boards',
        'confluence://pages',
        'confluence://spaces'
      ].forEach((uri, idx) => {
        console.log(`  ${idx + 1}. ${uri}`);
      });
    }
  } catch (error) {
    console.log("Error listing resources:", error instanceof Error ? error.message : String(error));
  }

  // Group tools by category
  console.log("\n=== Tools by Category ===");
  const toolsByCategory: Record<string, any[]> = {};
  toolsResult.tools.forEach(tool => {
    let category = "Other";
    if (tool.name.startsWith("create") || tool.name.startsWith("update") || 
        tool.name.startsWith("delete") || tool.name.startsWith("get")) {
      if (tool.name.toLowerCase().includes("issue") || tool.name.toLowerCase().includes("sprint") || 
          tool.name.toLowerCase().includes("board") || tool.name.toLowerCase().includes("filter")) {
        category = "Jira";
      } else if (tool.name.toLowerCase().includes("page") || tool.name.toLowerCase().includes("comment") || 
                tool.name.toLowerCase().includes("space")) {
        category = "Confluence";
      }
    }
    if (!toolsByCategory[category]) toolsByCategory[category] = [];
    toolsByCategory[category].push(tool);
  });
  Object.entries(toolsByCategory).forEach(([category, tools]) => {
    console.log(`\n${category} Tools (${tools.length}):`);
    tools.forEach((tool, index) => {
      console.log(`  ${index + 1}. ${tool.name}`);
    });
  });

  // Group resources by category
  console.log("\n=== Resources by Category ===");
  const resourcesByCategory: Record<string, any[]> = {};
  resourcesResult.resources.forEach((resource: any) => {
    let category = "Other";
    const uri = resource.uriPattern || resource.uri || "";
    if (uri.startsWith("jira://")) {
      category = "Jira";
    } else if (uri.startsWith("confluence://")) {
      category = "Confluence";
    }
    if (!resourcesByCategory[category]) resourcesByCategory[category] = [];
    resourcesByCategory[category].push(resource);
  });
  Object.entries(resourcesByCategory).forEach(([category, resources]) => {
    console.log(`\n${category} Resources (${resources.length}):`);
    resources.forEach((resource: any, index: number) => {
      const uri = resource.uriPattern || resource.uri || "";
      console.log(`  ${index + 1}. ${uri}`);
    });
  });

  // Show details for some important tools
  console.log("\n=== Tool Details ===");
  const toolsToInspect = ["createIssue", "updatePage", "addComment"];
  for (const toolName of toolsToInspect) {
    const tool = toolsResult.tools.find(t => t.name === toolName);
    if (tool) {
      console.log(`\nTool: ${tool.name}`);
      console.log(`Description: ${tool.description || 'No description'}`);
      console.log("Input Schema:", JSON.stringify(tool.inputSchema, null, 2));
    }
  }

  await client.close();
  console.log("\nDone.");
}

main();
