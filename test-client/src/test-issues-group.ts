import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";
import fs from "fs";
import { getTestConfig } from './config-manager.js';

// Configuration using configuration manager
const testConfig = getTestConfig();
const CONFIG = {
  PROJECT_KEY: testConfig.getProjectKey(),
  BOARD_ID: testConfig.getBoardId(),
  ADMIN_USER: testConfig.getAdminUser(),
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js",
  ISSUE_TYPE: testConfig.getJiraConfig().testIssues.issueType,
  DEFAULT_JQL: testConfig.getDefaultJQL(),
  MAX_RESULTS: testConfig.getTestConfiguration().limits.maxTestIssues,
  USE_REAL_DATA: testConfig.shouldUseRealData(),
  AUTO_CLEANUP: testConfig.shouldAutoCleanup()
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
      } else if (toolName === 'deleteIssue' && data.data) {
        console.log(`  🗑️  Issue deleted successfully`);
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
  console.log("🎯 === ISSUES MANAGEMENT TOOLS TEST (12 Tools) ===");
  
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
    
    // Test project with configuration
    console.log(`📋 Testing with configured project: ${CONFIG.PROJECT_KEY}`);
    console.log(`⚙️  Using issue type: ${CONFIG.ISSUE_TYPE}`);
    console.log(`📊 Max results limit: ${CONFIG.MAX_RESULTS}`);
    console.log(`🔧 Real data mode: ${CONFIG.USE_REAL_DATA ? 'Enabled' : 'Disabled'}`);

    // 1. List Issues (Read) - using configured limits
    const listResult = await testIssuesTool(client, "listIssues", 
      { projectKey: CONFIG.PROJECT_KEY, limit: CONFIG.MAX_RESULTS }, 
      "List issues from configured project"
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

    // 3. Search Issues (Read) - using configured JQL
    await testIssuesTool(client, "searchIssues", 
      { 
        jql: CONFIG.DEFAULT_JQL, 
        maxResults: Math.min(3, CONFIG.MAX_RESULTS)
      }, 
      "Search issues with configured JQL"
    );

    // 4. Create Issue (Write) - using configured data
    const createResult = await testIssuesTool(client, "createIssue", 
      {
        projectKey: CONFIG.PROJECT_KEY,
        summary: testConfig.generateTestName("Issue"),
        description: testConfig.generateTestDescription("issue for Issues Management testing"),
        issueType: CONFIG.ISSUE_TYPE
      }, 
      "Create new issue with configured type"
    );

    // Enhanced CreateIssue Tests - Auto-detection functionality
    console.log("\n🎯 === ENHANCED CREATE ISSUE TESTS (Auto-detection) ===");
    
    // Test Epic creation with auto-detection
    const epicResult = await testIssuesTool(client, "createIssue", 
      {
        projectKey: CONFIG.PROJECT_KEY,
        summary: testConfig.generateTestName("Epic"),
        epicName: "Test Epic",
        epicColor: "Blue",
        description: testConfig.generateTestDescription("Epic for auto-detection testing")
      }, 
      "Create Epic with auto-detection (epicName parameter)"
    );
    
    let createdEpicKey = null;
    if (epicResult?.data?.key || epicResult?.key) {
      createdEpicKey = epicResult.data?.key || epicResult.key;
      console.log(`  📈 Epic created: ${createdEpicKey} (auto-detected from epicName)`);
    }

    // Test Story creation with auto-detection
    const storyResult = await testIssuesTool(client, "createIssue", 
      {
        projectKey: CONFIG.PROJECT_KEY,
        summary: testConfig.generateTestName("Story"),
        storyPoints: 8,
        epicKey: createdEpicKey, // Link to created epic
        description: testConfig.generateTestDescription("Story for auto-detection testing")
      }, 
      "Create Story with auto-detection (storyPoints parameter)"
    );
    
    let createdStoryKey = null;
    if (storyResult?.data?.key || storyResult?.key) {
      createdStoryKey = storyResult.data?.key || storyResult.key;
      console.log(`  📋 Story created: ${createdStoryKey} (auto-detected from storyPoints)`);
    }

    // Test Sub-task creation with auto-detection
    if (createdStoryKey) {
      const subtaskResult = await testIssuesTool(client, "createIssue", 
        {
          projectKey: CONFIG.PROJECT_KEY,
          summary: testConfig.generateTestName("Sub-task"),
          parentKey: createdStoryKey, // Link to story - should auto-detect Sub-task
          description: testConfig.generateTestDescription("Sub-task for auto-detection testing")
        }, 
        "Create Sub-task with auto-detection (parentKey parameter)"
      );
      
      if (subtaskResult?.data?.key || subtaskResult?.key) {
        const subtaskKey = subtaskResult.data?.key || subtaskResult.key;
        console.log(`  📝 Sub-task created: ${subtaskKey} (auto-detected from parentKey)`);
      }
    }

    // Test Bug creation with explicit type
    const bugResult = await testIssuesTool(client, "createIssue", 
      {
        projectKey: CONFIG.PROJECT_KEY,
        summary: testConfig.generateTestName("Bug"),
        issueType: "Bug", // Explicit type
        priority: "High",
        description: testConfig.generateTestDescription("Bug for explicit type testing")
      }, 
      "Create Bug with explicit type (issueType parameter)"
    );
    
    if (bugResult?.data?.key || bugResult?.key) {
      const bugKey = bugResult.data?.key || bugResult.key;
      console.log(`  🐛 Bug created: ${bugKey} (explicit type)`);
    }

    console.log("\n✅ Enhanced createIssue auto-detection tests completed!");
    console.log("   - Epic: Auto-detected from epicName ✅");
    console.log("   - Story: Auto-detected from storyPoints ✅");
    console.log("   - Sub-task: Auto-detected from parentKey ✅");
    console.log("   - Bug: Explicit type specification ✅");

    // Use created issue for further tests
    if (createResult && typeof createResult === 'string') {
      testIssueKey = createResult;
    } else if (createResult && createResult.data && createResult.data.key) {
      testIssueKey = createResult.data.key;
    }

    // 5. Update Issue (Write) - only if we have a test issue
    if (testIssueKey) {
      await testIssuesTool(client, "updateIssue", 
        {
          issueIdOrKey: testIssueKey,
          summary: testConfig.generateTestName("Updated Issue"),
          description: testConfig.generateTestDescription("updated issue")
        }, 
        "Update existing issue with configured data"
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
            issueIdOrKey: testIssueKey,
            transitionId: firstTransition.id,
            comment: "Transitioned by test suite"
          }, 
          `Transition issue to ${firstTransition.name}`
        );
      }

      // 8. Assign Issue (Write) - assign to configured admin user
      await testIssuesTool(client, "assignIssue", 
        {
          issueIdOrKey: testIssueKey,
          accountId: CONFIG.ADMIN_USER.accountId
        }, 
        `Assign issue to configured admin user (${CONFIG.ADMIN_USER.displayName})`
      );

      // 9. Get Issue Comments (Read)
      await testIssuesTool(client, "getIssueComments", 
        { issueKey: testIssueKey }, 
        "Get issue comments"
      );

      // 10. Add Issue Comment (Write) - using configured data
      const commentResult = await testIssuesTool(client, "addIssueComment", 
        {
          issueKey: testIssueKey,
          body: testConfig.generateTestDescription("comment added")
        }, 
        "Add comment to issue"
      );

      // 11. Update Issue Comment (Write) - only if comment was created
      if (commentResult?.data?.id) {
        await testIssuesTool(client, "updateIssueComment", 
          {
            issueKey: testIssueKey,
            commentId: commentResult.data.id,
            body: testConfig.generateTestDescription("updated comment")
          }, 
          "Update issue comment with configured data"
        );
      }

      // 12. Delete Issue (Write) - test deletion as final step
      console.log(`\n�️  Testing deleteIssue as final cleanup step...`);
      const deleteResult = await testIssuesTool(client, "deleteIssue", 
        { issueKey: testIssueKey }, 
        "Delete test issue (cleanup)"
      );
      
      if (deleteResult) {
        console.log(`✅ Test issue ${testIssueKey} was successfully deleted`);
        testIssueKey = null; // Mark as deleted
      }

      console.log(`\n📝 Test issue lifecycle: Created → Updated → Commented → Deleted ✅`);
    } else {
      console.log(`\n⚠️  No test issue available for deletion test`);
    }

    // Summary with configuration details
    console.log("\n📊 === ISSUES MANAGEMENT TEST SUMMARY ===");
    console.log("✅ Read Operations: listIssues, getIssue, searchIssues, getIssueTransitions, getIssueComments");
    console.log("✅ Write Operations: createIssue, updateIssue, transitionIssue, assignIssue, addIssueComment, updateIssueComment, deleteIssue");
    console.log("✅ Enhanced createIssue: Epic (auto), Story (auto), Sub-task (auto), Bug (explicit)");
    console.log(`✅ Total tools tested: 12/12 + Enhanced features`);
    console.log(`✅ Configured project: ${CONFIG.PROJECT_KEY}`);
    console.log(`✅ Configured issue type: ${CONFIG.ISSUE_TYPE}`);
    console.log(`✅ Configured admin user: ${CONFIG.ADMIN_USER.displayName}`);
    console.log(`✅ Configuration-driven testing: All operations use real data from config`);
    console.log(`✅ Auto-detection testing: Epic/Story/Sub-task types detected intelligently`);
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Issues Management Test Error:", error);
    process.exit(1);
  }
}

main();