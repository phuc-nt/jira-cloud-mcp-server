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

// Helper to safely extract response data
function extractResponseData(result: any): any {
  if (result.content && Array.isArray(result.content) && result.content[0]?.text) {
    try {
      return JSON.parse(result.content[0].text);
    } catch {
      return result.content[0].text;
    }
  }
  return result;
}

async function checkIssueFields() {
  console.log('🔍 Kiểm tra Issue Fields Configuration');
  console.log('=====================================');
  
  try {
    // Setup client connection
    const envVars = loadEnv();
    const client = new Client({ name: "check-issue-fields", version: "1.0.0" });
    
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
      }
    });

    const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
    const transport = new StdioClientTransport({
      command: "node",
      args: [serverPath],
      env: { ...processEnv, ...envVars }
    });

    await client.connect(transport);
    console.log("✅ Connected to MCP Jira Server");

    console.log('\n1️⃣ Kiểm tra trạng thái hiện tại của issue XDEMO2-131:');
    const currentIssueResult = await client.callTool({ 
      name: 'getIssue', 
      arguments: { issueKey: 'XDEMO2-131' }
    });
    const currentIssue = extractResponseData(currentIssueResult);
    
    if (currentIssue && currentIssue.success !== false) {
      console.log('✅ Issue hiện tại:');
      console.log('  - Key:', currentIssue.issue?.key);
      console.log('  - Summary:', currentIssue.issue?.fields?.summary);
      console.log('  - Fix Versions:', currentIssue.issue?.fields?.fixVersions || 'None');
      console.log('  - Project:', currentIssue.issue?.fields?.project?.key);
    } else {
      console.log('❌ Failed to get issue:', currentIssue.error || 'Unknown error');
    }
    
    console.log('\n2️⃣ Kiểm tra issue edit metadata:');
    const editMetaResult = await client.callTool({ 
      name: 'getIssueEditMeta', 
      arguments: { issueKey: 'XDEMO2-131' }
    });
    const editMeta = extractResponseData(editMetaResult);
    
    if (editMeta && editMeta.success !== false && editMeta.fields) {
      console.log('✅ Available fields for editing:');
      Object.keys(editMeta.fields).forEach(fieldKey => {
        const field = editMeta.fields[fieldKey];
        console.log(`  - ${fieldKey}: ${field.name} (${field.schema?.type || 'unknown type'})`);
        if (fieldKey === 'fixVersions') {
          console.log('    🎯 Found fixVersions field!');
        }
      });
    } else {
      console.log('❌ Failed to get edit metadata:', editMeta.error || 'Unknown error');
    }
    
    console.log('\n3️⃣ Thử update với field khác để test API:');
    const testUpdateResult = await client.callTool({ 
      name: 'updateIssue', 
      arguments: {
        issueKey: 'XDEMO2-131',
        summary: 'Bug fix for authentication - Updated at ' + new Date().toISOString()
      }
    });
    const testUpdate = extractResponseData(testUpdateResult);
    
    if (testUpdate && testUpdate.success !== false) {
      console.log('✅ Basic update works - API connection OK');
    } else {
      console.log('❌ Basic update failed:', testUpdate.error || testUpdate);
    }
    
    console.log('\n4️⃣ Kiểm tra project configuration:');
    const projectInfoResult = await client.callTool({ 
      name: 'getProject', 
      arguments: {
        projectKey: 'XDEMO2',
        expand: 'issueTypes'
      }
    });
    const projectInfo = extractResponseData(projectInfoResult);
    
    if (projectInfo && projectInfo.success !== false && projectInfo.project) {
      console.log('✅ Project type:', projectInfo.project.projectTypeKey);
      console.log('✅ Project style:', projectInfo.project.style);
      console.log('✅ Available issue types:');
      projectInfo.project.issueTypes?.forEach((type: any) => {
        console.log(`  - ${type.name} (${type.id})`);
      });
    } else {
      console.log('❌ Failed to get project info:', projectInfo.error || 'Unknown error');
    }

    await client.close();
    
  } catch (error) {
    console.error('❌ Error:', error);
  }
  
  console.log('\n📋 Summary và Recommendations:');
  console.log('1. Kiểm tra Jira project configuration');
  console.log('2. Verify Fix Version field is available on issue screens');
  console.log('3. Consider using different update approach');
}

checkIssueFields()
  .then(() => process.exit(0))
  .catch(error => {
    console.error('❌ Test failed:', error);
    process.exit(1);
  });
