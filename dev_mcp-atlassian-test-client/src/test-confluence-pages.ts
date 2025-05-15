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

// Print only response data
function printResourceMetaAndSchema(res: any) {
  if (res.contents && res.contents.length > 0) {
    const content = res.contents[0];
    
    // COMMENTED OUT: Metadata and schema printing
    // // Print metadata if exists
    // if (content.metadata) {
    //   console.log("Metadata:", content.metadata);
    // }
    // // Print schema if exists
    // if (content.schema) {
    //   console.log("Schema:", JSON.stringify(content.schema, null, 2));
    // }
    
    // Try to parse text if exists
    if (content.text) {
      try {
        const data = JSON.parse(String(content.text));
        console.log("Response Data:", JSON.stringify(data, null, 2));
      } catch (e) {
        console.log("Raw Response:", content.text);
      }
    }
  }
}

async function main() {
  const client = new Client({
    name: "mcp-atlassian-test-client-confluence-pages",
    version: "1.0.0"
  });

  // Path to MCP server
  const serverPath = "/opt/homebrew/lib/node_modules/@phuc-nt/mcp-atlassian-server/dist/index.js";

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

  console.log("\n=== Test Confluence Pages Resource ===");

  // Change these values to match your environment if needed
  const pageId = "19464453"; // Home page id mới cho space AWA1
  
  // Thay thế truy vấn CQL bằng truy vấn trực tiếp đến space hoặc title
  const spaceKey = "AWA1"; // Space key mới
  
  const resourceUris = [
    `confluence://pages/${pageId}`,
    `confluence://spaces/${spaceKey}/pages`,
    `confluence://pages/${pageId}/children`,
    `confluence://pages/${pageId}/comments`,
    `confluence://pages/${pageId}/versions`,
    `confluence://pages/${pageId}/ancestors`,
    `confluence://pages/${pageId}/attachments`
  ];

  for (const uri of resourceUris) {
    try {
      console.log(`\nResource: ${uri}`);
      const res = await client.readResource({ uri });
      if (uri.includes("?cql=")) {
        const pagesData = JSON.parse(String(res.contents[0].text));
        console.log("Number of pages from CQL:", pagesData.pages?.length || 0);
      } else if (uri.includes("/children")) {
        const childrenData = JSON.parse(String(res.contents[0].text));
        console.log("Number of children:", childrenData.children?.length || 0);
      } else if (uri.includes("/comments")) {
        const commentsData = JSON.parse(String(res.contents[0].text));
        console.log("Number of comments:", commentsData.comments?.length || 0);
      } else if (uri.includes("/versions")) {
        const versionsData = JSON.parse(String(res.contents[0].text));
        console.log("Number of versions:", versionsData.versions?.length || 0);
      } else if (uri.includes("/ancestors")) {
        const ancestorsData = JSON.parse(String(res.contents[0].text));
        console.log("Number of ancestors:", ancestorsData.ancestors?.length || 0);
      } else if (uri.includes("/attachments")) {
        const attachmentsData = JSON.parse(String(res.contents[0].text));
        console.log("Number of attachments:", attachmentsData.attachments?.length || 0);
      }
      printResourceMetaAndSchema(res);
    } catch (e) {
      console.error(`Resource ${uri} error:`, e instanceof Error ? e.message : e);
    }
  }

  console.log("\n=== Finished testing Confluence Pages Resource! ===");
  await client.close();
}

main();