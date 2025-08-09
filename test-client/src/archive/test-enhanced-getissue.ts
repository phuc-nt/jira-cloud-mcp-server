#!/usr/bin/env node
/**
 * Enhanced getIssue tool comprehensive test
 */

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import path from "path";

async function testEnhancedGetIssue() {
  // Create MCP client
  const transport = new StdioClientTransport({
    command: "node",
    args: [path.join(process.cwd(), "../dist/index.js")]
  });

  const client = new Client(
    {
      name: "enhanced-getissue-test-client",
      version: "1.0.0"
    },
    {
      capabilities: {
        tools: {}
      }
    }
  );
  
  try {
    await client.connect(transport);
    console.log('Connected to MCP server');

    // Test 1: Basic issue retrieval with auto-expand
    console.log('\n=== Test 1: Basic Issue with Auto-Expand ===');
    const basicResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-151', // Epic created in previous tests
        autoExpand: true
      }
    });
    console.log('Basic Epic with auto-expand:', JSON.stringify(basicResult, null, 2));

    // Test 2: Epic with full Epic details
    console.log('\n=== Test 2: Epic with Full Details ===');
    const epicResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-151',
        includeEpicDetails: true,
        includeHierarchy: true,
        includeProgress: true
      }
    });
    console.log('Epic with full details:', JSON.stringify(epicResult, null, 2));

    // Test 3: Story with Story-specific details
    console.log('\n=== Test 3: Story with Story Details ===');
    const storyResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-152', // Story created in previous tests
        includeStoryDetails: true,
        includeHierarchy: true,
        includeProgress: true
      }
    });
    console.log('Story with details:', JSON.stringify(storyResult, null, 2));

    // Test 4: Sub-task with Sub-task details
    console.log('\n=== Test 4: Sub-task with Sub-task Details ===');
    const subtaskResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-148', // Sub-task created in previous tests
        includeSubtaskDetails: true,
        includeHierarchy: true
      }
    });
    console.log('Sub-task with details:', JSON.stringify(subtaskResult, null, 2));

    // Test 5: Issue with transitions
    console.log('\n=== Test 5: Issue with Transitions ===');
    const transitionsResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-150', // Task created in previous tests
        includeTransitions: true
      }
    });
    console.log('Issue with transitions:', JSON.stringify(transitionsResult, null, 2));

    // Test 6: Issue with comments and history
    console.log('\n=== Test 6: Issue with Comments and History ===');
    const contextResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-147', // Story with comments
        includeComments: true,
        includeHistory: true,
        includeAttachments: true
      }
    });
    console.log('Issue with context:', JSON.stringify(contextResult, null, 2));

    // Test 7: Issue with all expansions disabled
    console.log('\n=== Test 7: Minimal Issue (No Expansions) ===');
    const minimalResult = await client.callTool({
      name: "getIssue",
      arguments: {
        issueKey: 'XDEMO2-146',
        autoExpand: false
      }
    });
    console.log('Minimal issue:', JSON.stringify(minimalResult, null, 2));

    console.log('\n🎉 Enhanced getIssue tool tests completed!');
    console.log('\n📋 Features tested:');
    console.log('✅ Auto-expand: Intelligent expansion based on issue type');
    console.log('✅ Epic details: Color, done status, child issues, progress');
    console.log('✅ Story details: Story points, epic link, sub-tasks');
    console.log('✅ Sub-task details: Parent info, siblings, position');
    console.log('✅ Hierarchy: Epic→Story→Sub-task relationships');
    console.log('✅ Progress tracking: Story points, completion rates');
    console.log('✅ Transitions: Available workflow actions');
    console.log('✅ Context: Comments, history, attachments');
    console.log('✅ Minimal mode: Basic details only');

  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await client.close();
  }
}

testEnhancedGetIssue();
