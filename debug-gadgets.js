import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "fs";

// Load environment variables from .env
function loadEnv() {
  try {
    const envFile = '.env';
    const envContent = fs.readFileSync(envFile, 'utf8');
    const envVars = {};
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

async function debugGadgets() {
  const envVars = loadEnv();
  const client = new Client({ name: "debug-gadgets-client", version: "1.0.0" });
  const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
  
  const processEnv = {};
  Object.keys(process.env).forEach(key => {
    if (process.env[key] !== undefined) {
      processEnv[key] = process.env[key];
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

  try {
    await client.connect(transport);
    console.log("Connected to server");

    // Call getJiraGadgets tool directly
    console.log("Calling getJiraGadgets tool...");
    const result = await client.callTool({
      name: "getJiraGadgets",
      arguments: {}
    });

    console.log("Raw result:");
    console.log(JSON.stringify(result, null, 2));

    if (result.content && result.content[0]) {
      console.log("\nContent text:");
      console.log(result.content[0].text);
    }

    await client.close();
    console.log("Connection closed");

  } catch (error) {
    console.error("Error:", error);
  }
}

debugGadgets();