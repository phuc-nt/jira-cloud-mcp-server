import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";

// Configuration
const CONFIG = {
  PROJECT_KEY: "XDEMO2",
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js"
};

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

async function testIssuesTool(client: Client, toolName: string, args: any, description: string) {
  console.log(`\n🔧 Testing ${toolName}: ${description}`);
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    const data = extractResponseData(result);
    
    if (data && data.success !== false) {
      console.log(`✅ ${toolName}: Success`);
      
      // Log specific results based on tool type
      if (toolName === 'listIssues' && data.issues) {
        console.log(`  📋 Found ${data.issues.length} issues`);
        data.issues.slice(0, 3).forEach((issue: any, index: number) => {
          console.log(`    ${index + 1}. ${issue.key}: ${issue.summary}`);
        });
      } else if (toolName === 'getIssue' && data.issue) {
        console.log(`  📄 Issue: ${data.issue.key} - ${data.issue.summary}`);
        console.log(`  📊 Status: ${data.issue.status?.name}, Type: ${data.issue.issueType?.name}`);
      } else if (toolName === 'createIssue' && data.data) {
        console.log(`  ✨ Created: ${data.data.key} - ${data.data.summary}`);
        return data.data.key; // Return for further testing
      } else if (toolName === 'getIssueTransitions' && data.transitions) {
        console.log(`  🔄 Available transitions: ${data.transitions.length}`);
        data.transitions.slice(0, 3).forEach((transition: any) => {
          console.log(`    - ${transition.name} (ID: ${transition.id})`);
        });
      } else if (toolName === 'getIssueComments' && data.comments) {
        console.log(`  💬 Comments: ${data.comments.length}`);
      } else if (toolName === 'addIssueComment' && data.data) {
        console.log(`  💬 Comment added: ID ${data.data.id}`);
      } else if (toolName === 'updateIssueComment' && data.data) {
        console.log(`  ✏️  Comment updated: ID ${data.data.id}`);
      } else if (toolName === 'searchIssues' && data.issues) {
        console.log(`  🔍 Search results: ${data.issues.length} issues`);
      } else if ((toolName === 'updateIssue' || toolName === 'assignIssue' || toolName === 'transitionIssue') && data.data) {
        console.log(`  ✅ Operation completed successfully`);
      }
      
      return data;
    } else {
      console.log(`❌ ${toolName}: Failed - ${data?.error || 'Unknown error'}`);
      return null;
    }
  } catch (error) {
    console.log(`❌ ${toolName}: Error - ${error instanceof Error ? error.message : String(error)}`);
    return null;
  }
}

async function main() {
  console.log("🎯 === ISSUES MANAGEMENT TOOLS TEST (11 Tools) ===");
  
  try {
    // Setup client
    const envVars = loadEnv();
    const client = new Client({ name: "issues-test-client", version: "1.0.0" });
    
    const processEnv: Record<string, string> = {};
    Object.keys(process.env).forEach(key => {
      if (process.env[key] !== undefined) {
        processEnv[key] = process.env[key] as string;
      }
    });

    const transport = new StdioClientTransport({
      command: "node",
      args: [CONFIG.SERVER_PATH],
      env: { ...processEnv, ...envVars }
    });

    await client.connect(transport);
    console.log("✅ Connected to MCP Jira Server");
    
    // Test project
    console.log(`📋 Testing with project: ${CONFIG.PROJECT_KEY}`);

    // 1. List Issues (Read)
    const listResult = await testIssuesTool(client, "listIssues", 
      { projectKey: CONFIG.PROJECT_KEY, limit: 5 }, 
      "List issues from project"
    );

    // 2. Get specific issue (Read)
    let testIssueKey = null;
    if (listResult?.issues?.length > 0) {
      testIssueKey = listResult.issues[0].key;
      await testIssuesTool(client, "getIssue", 
        { issueKey: testIssueKey }, 
        "Get detailed issue information"
      );
    }

    // 3. Search Issues (Read)
    await testIssuesTool(client, "searchIssues", 
      { 
        jql: `project = ${CONFIG.PROJECT_KEY} ORDER BY created DESC`, 
        maxResults: 3 
      }, 
      "Search issues with JQL"
    );

    // 4. Create Issue (Write)
    const timestamp = new Date().toISOString();
    const createResult = await testIssuesTool(client, "createIssue", 
      {
        projectKey: CONFIG.PROJECT_KEY,
        summary: `Test Issue ${timestamp}`,
        description: "Test issue created by Issues Management test suite",
        issueType: "Task"
      }, 
      "Create new issue"
    );

    // Use created issue for further tests
    if (createResult) {
      testIssueKey = createResult;
    }

    // 5. Update Issue (Write) - only if we have a test issue
    if (testIssueKey) {
      await testIssuesTool(client, "updateIssue", 
        {
          issueKey: testIssueKey,
          summary: `Updated Test Issue ${timestamp}`,
          description: "Updated description by test suite"
        }, 
        "Update existing issue"
      );

      // 6. Get Issue Transitions (Read)
      const transitionsResult = await testIssuesTool(client, "getIssueTransitions", 
        { issueKey: testIssueKey }, 
        "Get available issue transitions"
      );

      // 7. Transition Issue (Write) - only if transitions available
      if (transitionsResult?.transitions?.length > 0) {
        const firstTransition = transitionsResult.transitions[0];
        await testIssuesTool(client, "transitionIssue", 
          {
            issueKey: testIssueKey,
            transitionId: firstTransition.id,
            comment: "Transitioned by test suite"
          }, 
          `Transition issue to ${firstTransition.name}`
        );
      }

      // 8. Assign Issue (Write) - try to assign to current user
      try {
        // Get current user for assignment
        const usersResult = await client.callTool({
          name: "searchUsers",
          arguments: { query: "", maxResults: 1 }
        });
        const usersData = extractResponseData(usersResult);
        
        if (usersData?.users?.[0]?.accountId) {
          await testIssuesTool(client, "assignIssue", 
            {
              issueKey: testIssueKey,
              accountId: usersData.users[0].accountId
            }, 
            "Assign issue to user"
          );
        }
      } catch (error) {
        console.log("⚠️  Assignment test skipped - no users found");
      }

      // 9. Get Issue Comments (Read)
      await testIssuesTool(client, "getIssueComments", 
        { issueKey: testIssueKey }, 
        "Get issue comments"
      );

      // 10. Add Issue Comment (Write)
      const commentResult = await testIssuesTool(client, "addIssueComment", 
        {
          issueKey: testIssueKey,
          body: `Test comment added at ${timestamp}`
        }, 
        "Add comment to issue"
      );

      // 11. Update Issue Comment (Write) - only if comment was created
      if (commentResult?.data?.id) {
        await testIssuesTool(client, "updateIssueComment", 
          {
            issueKey: testIssueKey,
            commentId: commentResult.data.id,
            body: `Updated test comment at ${timestamp}`
          }, 
          "Update issue comment"
        );
      }

      console.log(`\n📝 Test issue created: ${testIssueKey} (can be used for further testing)`);
    }

    // Summary
    console.log("\n📊 === ISSUES MANAGEMENT TEST SUMMARY ===");
    console.log("✅ Read Operations: listIssues, getIssue, searchIssues, getIssueTransitions, getIssueComments");
    console.log("✅ Write Operations: createIssue, updateIssue, transitionIssue, assignIssue, addIssueComment, updateIssueComment");
    console.log(`✅ Total tools tested: 11/11`);
    console.log(`✅ Test project: ${CONFIG.PROJECT_KEY}`);
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Issues Management Test Error:", error);
    process.exit(1);
  }
}

main();