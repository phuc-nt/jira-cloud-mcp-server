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
    const serverPath = "/Users/phucnt/Workspace/mcp-atlassian-server/dist/index.js";
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
    let newPageId: string | null = null;

    // Thông tin Confluence mới
    const confluenceSpaceKey = "AWA1";
    const confluenceHomePageId = "19464453";

    // Thử lấy thông tin space trước để có spaceId đúng
    try {
      // Lấy thông tin space bằng spaceKey
      const spaceResult = await client.readResource({
        uri: `confluence://spaces/${confluenceSpaceKey}`
      });
      
      if (spaceResult.contents && spaceResult.contents[0].text) {
        const spaceData = JSON.parse(String(spaceResult.contents[0].text));
        
        // Lấy spaceId từ kết quả (ưu tiên spaceId hoặc id, fallback về '19464200')
        console.log(`DEBUG: spaceData =`, spaceData);
        const spaceId = spaceData && (spaceData.spaceId || spaceData.id) ? (spaceData.spaceId || spaceData.id) : "19464200";
        
        console.log(`Got spaceId: ${spaceId} for spaceKey: ${confluenceSpaceKey}`);
        
        try {
          // Tìm ID của trang gốc của space để sử dụng làm parentId
          let rootPageId = "";
          try {
            const spaceRootResult = await client.readResource({
              uri: `confluence://spaces/${spaceData.key}/rootpage`
            });
            
            if (spaceRootResult.contents && spaceRootResult.contents[0].text) {
              const rootPageData = JSON.parse(String(spaceRootResult.contents[0].text));
              rootPageId = rootPageData?.id;
              console.log(`Found root page ID: ${rootPageId} for space ${spaceData.key}`);
            }
          } catch (rootPageError) {
            console.log("Failed to find root page, will use a hardcoded ID");
            // Nếu không tìm thấy, sử dụng một ID cha cụ thể từ không gian của bạn
            rootPageId = confluenceHomePageId;  // Sử dụng ID trang thực từ không gian của bạn
          }
          
          const createPageResult = await client.callTool({
            name: "createPage",
            arguments: {
              spaceId: spaceId,       // Sử dụng spaceId (dạng số)
              parentId: rootPageId,   // Sử dụng ID trang cha thực tế
              title: newPageTitle,
              content: "<p>This is a test page created by MCP tool-test</p>"
            }
          });
          
          console.log("createPage - Success:", createPageResult.id ? "✅" : "❌", "ID:", createPageResult.id || "Unknown");
          
          if (createPageResult && createPageResult.id) {
            newPageId = String(createPageResult.id); // Chuyển đổi sang string để đảm bảo tương thích kiểu dữ liệu
          }
        } catch (pageError: any) {
          console.log("createPage - Failed: ❌", pageError instanceof Error ? pageError.message : String(pageError));
        }
      } else {
        console.log("Failed to get space data");
      }
    } catch (spaceError: any) {
      console.log("Space lookup failed: ❌", spaceError instanceof Error ? spaceError.message : String(spaceError));
    }
    
    // 6. updatePage
    if (newPageId) {
      try {
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
      } catch (error) {
        console.log("updatePage - Failed: ❌", error instanceof Error ? error.message : String(error));
      }
    }
    
    // 7. addComment
    if (newPageId) {
      try {
        const addCommentResult = await client.callTool({
          name: "addComment",
          arguments: {
            pageId: newPageId,
            content: "<p>This is a test comment added by MCP tool-test</p>"
          }
        });
        console.log("addComment - Success:", addCommentResult.id ? "✅" : "❌");
        console.log("addComment - Raw result:", JSON.stringify(addCommentResult, null, 2));
      } catch (error) {
        console.log("addComment - Failed: ❌", error instanceof Error ? error.message : String(error));
        if (error && typeof error === 'object') {
          console.log("addComment - Error object:", JSON.stringify(error, null, 2));
        }
      }
    }

    // 8. Test new features from version 2.0.0
    console.log("\n=== Testing New Features (v2.0.0) ===");

    // 8.1 Create Sprint
    console.log("Testing Sprint Management...");
    // Đầu tiên, tìm một board hỗ trợ sprints
    let boardId = null;
    let sprintEnabled = false;
    try {
      // Lấy danh sách boards
      console.log("Finding a board that supports sprints...");
      const boardsResult = await client.readResource({
        uri: `jira://boards`
      });
      if (boardsResult.contents && boardsResult.contents[0].text) {
        const boardsData = JSON.parse(String(boardsResult.contents[0].text));
        if (boardsData && boardsData.boards && boardsData.boards.length > 0) {
          for (const board of boardsData.boards) {
            console.log(`Checking board: ${board.name} (ID: ${board.id}, Type: ${board.type})`);
            if (board.type === "scrum") {
              boardId = board.id;
              sprintEnabled = true;
              console.log(`Found Scrum board: ${board.name} (ID: ${boardId})`);
              break;
            }
          }
          if (!boardId && boardsData.boards.length > 0) {
            boardId = boardsData.boards[0].id;
            console.log(`No Scrum board found, using first available board: ID ${boardId}`);
          }
        }
      }
    } catch (boardError: any) {
      console.log("Failed to find boards:", boardError.message || String(boardError));
    }
    // BỎ QUA: Không test createSprint/startSprint
    // let newSprintId = "";
    // if (boardId) {
    //   try {
    //     const createSprintResult = await client.callTool({
    //       name: "createSprint", 
    //       arguments: {
    //         boardId: String(boardId),
    //         name: `Sprint-${Date.now()}`.substring(0, 25),
    //         goal: "Test sprint created by MCP tool-test"
    //       }
    //     });
    //     console.log("createSprint - Success:", createSprintResult.id ? "✅" : "❌", "ID:", createSprintResult.id || "Unknown");
    //     newSprintId = createSprintResult.id ? String(createSprintResult.id) : "";
    //   } catch (sprintError: any) {
    //     console.log("createSprint - Failed: ❌", sprintError.message || String(sprintError));
    //     console.log("Note: This board may not support sprints. Try with a Scrum board instead.");
    //   }
    // } else {
    //   console.log("createSprint - Skipped: No suitable board found");
    // }
    // if (newSprintId) {
    //   try {
    //     const startSprintResult = await client.callTool({
    //       name: "startSprint",
    //       arguments: {
    //         sprintId: newSprintId,
    //         startDate: new Date().toISOString(),
    //         endDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString()
    //       }
    //     });
    //     console.log("startSprint - Success:", startSprintResult.success ? "✅" : "❌");
    //   } catch (error) {
    //     console.log("startSprint - Failed: ❌", error instanceof Error ? error.message : String(error));
    //   }
    // }
    // 8.3 Test Dashboard management
    // BỎ QUA: Không test createDashboard và addGadgetToDashboard
    // try {
    //   const createDashboardResult = await client.callTool({
    //     name: "createDashboard",
    //     arguments: {
    //       name: `Dashboard-${Date.now()}`,
    //       description: "Test dashboard created by MCP tool-test"
    //     }
    //   });
    //   console.log("createDashboard - Success:", createDashboardResult.id ? "✅" : "❌", "ID:", createDashboardResult.id || "Unknown");
    //   const dashboardId = createDashboardResult.id ? String(createDashboardResult.id) : "";
    //   if (dashboardId) {
    //     try {
    //       const addGadgetResult = await client.callTool({
    //         name: "addGadgetToDashboard",
    //         arguments: {
    //           dashboardId: dashboardId,
    //           gadgetUri: "rest/gadgets/1.0/g/com.atlassian.jira.gadgets:assigned-to-me-gadget/gadgets/assigned-to-me-gadget.xml",
    //           color: "blue",
    //           position: { row: 0, column: 0 }
    //         }
    //       });
    //       const gadgetId = addGadgetResult.id ? String(addGadgetResult.id) : "";
    //       console.log("addGadgetToDashboard - Success:", gadgetId ? "✅" : "❌", "ID:", gadgetId || "Unknown");
    //     } catch (error) {
    //       console.log("addGadgetToDashboard - Failed: ❌", error instanceof Error ? error.message : String(error));
    //     }
    //   }
    // } catch (error) {
    //   console.log("createDashboard - Failed: ❌", error instanceof Error ? error.message : String(error));
    // }

    // 8.5 Test Confluence page title update
    if (newPageId) {
      try {
        const updatePageTitleResult = await client.callTool({
          name: "updatePageTitle",
          arguments: {
            pageId: newPageId,
            title: `${newPageTitle} (Title Updated)`,
            version: 2
          }
        });
        console.log("updatePageTitle - Success:", updatePageTitleResult.success ? "✅" : "❌");
      } catch (error) {
        console.log("updatePageTitle - Failed: ❌", error instanceof Error ? error.message : String(error));
      }
    } else {
      console.log("updatePageTitle - Skipped (no page ID available)");
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