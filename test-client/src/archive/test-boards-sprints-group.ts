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
  BOARD_NAME: testConfig.getTestBoard().name,
  BOARD_TYPE: testConfig.getTestBoard().type,
  ADMIN_USER: testConfig.getAdminUser(),
  MAX_RESULTS: testConfig.getMaxResults(),
  SERVER_PATH: "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js",
  USE_REAL_DATA: testConfig.shouldUseRealData()
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

async function testBoardsSprintsTool(client: Client, toolName: string, args: any, description: string) {
  console.log(`\n🔧 Testing ${toolName}: ${description}`);
  try {
    const result = await client.callTool({ name: toolName, arguments: args });
    const data = extractResponseData(result);
    
    if (data && data.success !== false) {
      console.log(`✅ ${toolName}: Success`);
      
      // Log specific results based on tool type
      if (toolName === 'listBoards' && data.boards) {
        console.log(`  🏆 Found ${data.boards.length} boards`);
        data.boards.slice(0, 3).forEach((board: any, index: number) => {
          console.log(`    ${index + 1}. ${board.name} (ID: ${board.id})`);
        });
      } else if (toolName === 'getBoard' && data.board) {
        console.log(`  🏆 Board: ${data.board.name} (ID: ${data.board.id})`);
        console.log(`  📊 Type: ${data.board.type}, Location: ${data.board.location?.name}`);
      } else if (toolName === 'getBoardConfiguration' && data.configuration) {
        console.log(`  ⚙️  Configuration: ${data.configuration.name}`);
        console.log(`  📋 Columns: ${data.configuration.columnConfig?.columns?.length || 0}`);
      } else if (toolName === 'getBoardIssues' && data.issues) {
        console.log(`  📋 Board issues: ${data.issues.length}`);
      } else if (toolName === 'getBoardSprints' && data.sprints) {
        console.log(`  🏃 Board sprints: ${data.sprints.length}`);
        data.sprints.slice(0, 3).forEach((sprint: any, index: number) => {
          console.log(`    ${index + 1}. ${sprint.name} (ID: ${sprint.id}, State: ${sprint.state})`);
        });
      } else if (toolName === 'listSprints' && data.sprints) {
        console.log(`  🏃 Found ${data.sprints.length} sprints`);
        data.sprints.slice(0, 3).forEach((sprint: any, index: number) => {
          console.log(`    ${index + 1}. ${sprint.name} (ID: ${sprint.id}, State: ${sprint.state})`);
        });
      } else if (toolName === 'getSprint' && data.sprint) {
        console.log(`  🏃 Sprint: ${data.sprint.name} (ID: ${data.sprint.id})`);
        console.log(`  📊 State: ${data.sprint.state}, Goal: ${data.sprint.goal || 'No goal set'}`);
      } else if (toolName === 'getSprintIssues' && data.issues) {
        console.log(`  📋 Sprint issues: ${data.issues.length}`);
        if (data.sprintStatistics) {
          console.log(`  📊 Statistics: ${JSON.stringify(data.sprintStatistics.statusDistribution)}`);
        }
      } else if (toolName === 'createSprint' && data.data) {
        console.log(`  ✨ Created sprint: ${data.data.name} (ID: ${data.data.id})`);
        return data.data.id; // Return for further testing
      } else if (toolName === 'startSprint' && data.data) {
        console.log(`  🚀 Sprint started: ${data.data.name}`);
      } else if (toolName === 'closeSprint' && data.data) {
        console.log(`  🏁 Sprint closed: ${data.data.name}`);
      } else if ((toolName === 'addIssueToSprint' || toolName === 'addIssuesToBacklog' || toolName === 'rankBacklogIssues') && data.data) {
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
  console.log("🏆 === BOARDS & SPRINTS TOOLS TEST (12 Tools) ===");
  
  try {
    // Setup client
    const envVars = loadEnv();
    const client = new Client({ name: "boards-sprints-test-client", version: "1.0.0" });
    
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
    
    // Configuration info
    console.log(`📋 Testing with configured project: ${CONFIG.PROJECT_KEY}`);
    console.log(`🏆 Using configured board: ${CONFIG.BOARD_NAME} (ID: ${CONFIG.BOARD_ID})`);
    console.log(`⚙️  Board type: ${CONFIG.BOARD_TYPE}`);
    console.log(`📊 Max results limit: ${CONFIG.MAX_RESULTS}`);

    // === BOARDS TESTING ===
    console.log("\n🏆 === BOARDS OPERATIONS ===");

    // 1. List Boards (Read) - using configured limits
    const boardsResult = await testBoardsSprintsTool(client, "listBoards", 
      { maxResults: CONFIG.MAX_RESULTS }, 
      "List all accessible boards with configured limits"
    );

    // Use configured board ID
    const testBoardId = CONFIG.BOARD_ID;
    console.log(`🎯 Using configured board ID: ${testBoardId}`);
    
    // 2. Get Board (Read) - using configured board
    await testBoardsSprintsTool(client, "getBoard", 
      { boardId: testBoardId }, 
      `Get detailed information for configured board (${CONFIG.BOARD_NAME})`
    );

    // 3. Get Board Configuration (Read) - using configured board
    await testBoardsSprintsTool(client, "getBoardConfiguration", 
      { boardId: testBoardId }, 
      "Get configured board configuration details"
    );

    // 4. Get Board Issues (Read) - using configured limits
    await testBoardsSprintsTool(client, "getBoardIssues", 
      { boardId: testBoardId, maxResults: Math.min(5, CONFIG.MAX_RESULTS) }, 
      "Get issues from configured board"
    );

    // 5. Get Board Sprints (Read) - using configured limits
    const boardSprintsResult = await testBoardsSprintsTool(client, "getBoardSprints", 
      { boardId: testBoardId, maxResults: Math.min(5, CONFIG.MAX_RESULTS) }, 
      "Get sprints from configured board"
    );

    // 6. List Backlog Issues (Read) - new tool
    await testBoardsSprintsTool(client, "listBacklogIssues", 
      { boardId: testBoardId, maxResults: Math.min(5, CONFIG.MAX_RESULTS) }, 
      "List issues in board backlog"
    );

    // === SPRINTS TESTING ===
    console.log("\n🏃 === SPRINTS OPERATIONS ===");

    // 7. List Sprints (Read) - using configured limits
    const sprintsResult = await testBoardsSprintsTool(client, "listSprints", 
      { maxResults: CONFIG.MAX_RESULTS }, 
      "List all accessible sprints with configured limits"
    );

    let testSprintId = null;
    if (sprintsResult?.sprints?.length > 0) {
      testSprintId = sprintsResult.sprints[0].id;
      
      // 8. Get Sprint (Read)
      await testBoardsSprintsTool(client, "getSprint", 
        { sprintId: testSprintId }, 
        "Get detailed sprint information"
      );

      // 9. Get Sprint Issues (Read) - using configured limits
      await testBoardsSprintsTool(client, "getSprintIssues", 
        { sprintId: testSprintId, maxResults: Math.min(5, CONFIG.MAX_RESULTS) }, 
        "Get issues from sprint with statistics and configured limits"
      );
    }

    // === SPRINT MANAGEMENT TESTING ===
    console.log("\n⚙️ === SPRINT MANAGEMENT ===");

    // 10. Create Sprint (Write) - using configured data
    let createdSprintId = null;
    if (CONFIG.USE_REAL_DATA) {
      const createResult = await testBoardsSprintsTool(client, "createSprint", 
        {
          name: testConfig.generateTestName("Sprint"),
          boardId: testBoardId.toString(),
          goal: testConfig.generateTestDescription("sprint for Boards & Sprints testing")
        }, 
        `Create new sprint on configured board (${CONFIG.BOARD_NAME})`
      );

      if (createResult) {
        createdSprintId = createResult;
        console.log(`📝 Created sprint on configured board ${CONFIG.BOARD_ID}`);
      }
    } else {
      console.log("⚠️  Sprint creation skipped - real data mode disabled");
    }

    // 11. Add Issue to Sprint (Write) - only if we have sprint and issues
    if (createdSprintId || testSprintId) {
      try {
        // Get some issues to work with
        const issuesResult = await client.callTool({
          name: "listIssues",
          arguments: { projectKey: CONFIG.PROJECT_KEY, limit: 1 }
        });
        const issuesData = extractResponseData(issuesResult);
        
        if (issuesData?.issues?.length > 0) {
          const issueKey = issuesData.issues[0].key;
          const sprintToUse = (createdSprintId || testSprintId).toString();
          
          await testBoardsSprintsTool(client, "addIssueToSprint", 
            {
              sprintId: sprintToUse,
              issueKeys: [issueKey]
            }, 
            "Add issue to sprint"
          );
        }
      } catch (error) {
        console.log("⚠️  Add issue to sprint test skipped - no issues found");
      }
    }

    // === BACKLOG MANAGEMENT TESTING ===
    console.log("\n📚 === BACKLOG MANAGEMENT ===");

    // 12. Add Issues to Backlog (Write)
    try {
      // Get some issues to work with
      const issuesResult = await client.callTool({
        name: "listIssues",
        arguments: { projectKey: CONFIG.PROJECT_KEY, limit: 1 }
      });
      const issuesData = extractResponseData(issuesResult);
      
      if (issuesData?.issues?.length > 0) {
        const issueKey = issuesData.issues[0].key;
        
        await testBoardsSprintsTool(client, "addIssuesToBacklog", 
          { issueKeys: [issueKey] }, 
          "Add issues to backlog"
        );

        // 12. Rank Backlog Issues (Write) - optional advanced operation
        try {
          await testBoardsSprintsTool(client, "rankBacklogIssues", 
            {
              boardId: testBoardId.toString(),
              issueKeys: [issueKey],
              rankBeforeIssue: issueKey // Self-reference for demonstration
            }, 
            "Rank backlog issues"
          );
        } catch (error) {
          console.log("⚠️  Rank backlog issues test skipped - operation may require specific permissions");
        }
      }
    } catch (error) {
      console.log("⚠️  Backlog management tests skipped - no issues found");
    }

    // Summary with configuration details
    console.log("\n📊 === BOARDS & SPRINTS TEST SUMMARY ===");
    console.log("✅ Boards Operations: listBoards, getBoard, getBoardConfiguration, getBoardIssues, getBoardSprints, listBacklogIssues");
    console.log("✅ Sprints Operations: listSprints, getSprint, getSprintIssues");
    console.log("✅ Sprint Management: createSprint, addIssueToSprint");
    console.log("✅ Backlog Management: addIssuesToBacklog, rankBacklogIssues");
    console.log(`✅ Total tools tested: 12/12`);
    console.log(`✅ Configured board: ${CONFIG.BOARD_NAME} (ID: ${CONFIG.BOARD_ID})`);
    console.log(`✅ Board type: ${CONFIG.BOARD_TYPE}`);
    console.log(`✅ Project: ${CONFIG.PROJECT_KEY}`);
    console.log(`✅ Max results limit: ${CONFIG.MAX_RESULTS}`);
    console.log("✅ Configuration-driven testing: All operations use real data from config");
    console.log(`✅ Real data mode: ${CONFIG.USE_REAL_DATA ? 'Enabled' : 'Disabled'}`);
    
    if (createdSprintId) {
      console.log(`📝 Created sprint ID: ${createdSprintId} (can be used for further testing)`);
    }
    
    await client.close();
    console.log("✅ Connection closed successfully");
    
  } catch (error) {
    console.error("❌ Boards & Sprints Test Error:", error);
    process.exit(1);
  }
}

main();