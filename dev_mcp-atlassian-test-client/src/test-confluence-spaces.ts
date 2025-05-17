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

// Print metadata and schema
function printResourceMetaAndSchema(res: any) {
  if (res.contents && res.contents.length > 0) {
    const content = res.contents[0];
    // Print metadata if exists
    if (content.metadata) {
      console.log("Metadata:", content.metadata);
    }
    // Print schema if exists
    if (content.schema) {
      console.log("Schema:", JSON.stringify(content.schema, null, 2));
    }
    // Try to parse text if exists
    if (content.text) {
      try {
        const data = JSON.parse(String(content.text));
        if (Array.isArray(data)) {
          console.log("Data (array, first element):", data[0]);
        } else if (typeof data === 'object') {
          console.log("Data (object):", data);
        } else {
          console.log("Data:", data);
        }
      } catch {
        console.log("Cannot parse text.");
      }
    }
  }
}

async function main() {
  const client = new Client({
    name: "mcp-atlassian-test-client-confluence-spaces",
    version: "1.0.0"
  });

  // Path to MCP server
  const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";

  // Load environment variables
  const envVars = loadEnv();
  const processEnv: Record<string, string> = {};
  Object.keys(process.env).forEach(key => {
    if (process.env[key] !== undefined) {
      processEnv[key] = process.env[key] as string;
    }
  });

  // Initialize transport
  const transport = new StdioClientTransport({
    command: "node",
    args: [serverPath],
    env: {
      ...processEnv,
      ...envVars
    }
  });

  // Connect to server
  console.log("Connecting to MCP server...");
  await client.connect(transport);

  console.log("\n=== Test Confluence Spaces Resource ===");

  // Nếu có biến spaceKey hoặc pageId, hãy cập nhật:
  const spaceKey = "AWA1"; // Space key mới
  const homePageId = "19464453"; // Home page id mới

  const resourceUris = [
    `confluence://spaces`,
    `confluence://spaces/${spaceKey}`,
    `confluence://spaces/${spaceKey}/pages`
  ];

  for (const uri of resourceUris) {
    try {
      console.log(`\nResource: ${uri}`);
      const res = await client.readResource({ uri });
      if (uri === "confluence://spaces") {
        const spacesData = JSON.parse(String(res.contents[0].text));
        console.log("Number of spaces:", spacesData.spaces?.length || 0);
      } else if (uri.includes("/pages")) {
        const pagesData = JSON.parse(String(res.contents[0].text));
        console.log("Number of pages:", pagesData.pages?.length || 0);
      }
      printResourceMetaAndSchema(res);
    } catch (e) {
      console.error(`Resource ${uri} error:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n=== Finished testing Confluence Spaces Resource! ===");
  await client.close();
}

main();