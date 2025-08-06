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
    name: "mcp-atlassian-test-client-jira-issues",
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

  console.log("\n=== Test Jira Issues Resource ===");

  // Change issueKey to match your environment if needed
  const issueKey = "XDEMO2-53";

  const resourceUris = [
    `jira://issues`,
    `jira://issues/${issueKey}`,
    `jira://issues/${issueKey}/transitions`,
    `jira://issues/${issueKey}/comments`
  ];

  for (const uri of resourceUris) {
    try {
      console.log(`\nResource: ${uri}`);
      const res = await client.readResource({ uri });
      if (uri === "jira://issues") {
        const issuesData = JSON.parse(String(res.contents[0].text));
        console.log("Number of issues:", issuesData.issues?.length || 0);
      }
      printResourceMetaAndSchema(res);
    } catch (e) {
      console.error(`Resource ${uri} error:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n=== Finished testing Jira Issues Resource! ===");
  await client.close();
}

main(); 