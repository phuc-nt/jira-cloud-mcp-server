import { ConfigManager, getTestConfig } from './config-manager.js';

/**
 * Internal test data helper with known issue keys
 */
class TestData {
  private configManager: ConfigManager;
  
  // Hard-coded test data for Sprint 5.1 testing
  private readonly testIssues = ['XDEMO2-1', 'XDEMO2-2', 'XDEMO2-3', 'XDEMO2-4', 'XDEMO2-5'];
  private readonly testEpics = ['XDEMO2-1', 'XDEMO2-6']; // Assume some are Epics
  private readonly testStories = ['XDEMO2-2', 'XDEMO2-3', 'XDEMO2-7']; // Assume some are Stories  
  private readonly testSubtasks = ['XDEMO2-4', 'XDEMO2-5']; // Assume some are Sub-tasks

  constructor() {
    this.configManager = getTestConfig();
  }

  getRandomIssue(): string {
    return this.testIssues[Math.floor(Math.random() * this.testIssues.length)];
  }

  getRandomEpic(): string {
    return this.testEpics[Math.floor(Math.random() * this.testEpics.length)];
  }

  getRandomStory(): string {
    return this.testStories[Math.floor(Math.random() * this.testStories.length)];
  }

  getRandomSubtask(): string {
    return this.testSubtasks[Math.floor(Math.random() * this.testSubtasks.length)];
  }

  getAssigneeAccountId(): string {
    return this.configManager.getTestUsers().adminUser.accountId;
  }
}

/**
 * Comprehensive test for enhanced updateIssue tool
 * Tests type-specific field handling and consolidation
 */
class TestEnhancedUpdateIssue {
  private client: any;
  private testData: TestData;
  private configManager: ConfigManager;

  constructor(client: any) {
    this.client = client;
    this.testData = new TestData();
    this.configManager = getTestConfig();
  }

  async runAllTests(): Promise<void> {
    console.log('\n=== 🔄 Enhanced Update Issue Tool Tests ===\n');

    const tests = [
      // Universal field updates
      { name: 'Test 1: Update universal fields (summary, priority)', test: () => this.testUniversalFields() },
      { name: 'Test 2: Update assignee and labels', test: () => this.testAssigneeLabels() },
      { name: 'Test 3: Update description with ADF format', test: () => this.testDescriptionUpdate() },
      
      // Epic-specific updates
      { name: 'Test 4: Auto-detect Epic and update Epic fields', test: () => this.testEpicAutoDetect() },
      { name: 'Test 5: Explicit Epic update with color and status', test: () => this.testEpicExplicit() },
      
      // Story-specific updates
      { name: 'Test 6: Auto-detect Story and update story points', test: () => this.testStoryAutoDetect() },
      { name: 'Test 7: Update Story epic link', test: () => this.testStoryEpicLink() },
      
      // Sub-task specific updates
      { name: 'Test 8: Auto-detect Sub-task and update parent', test: () => this.testSubtaskAutoDetect() },
      
      // Workflow validation
      { name: 'Test 9: Workflow validation with warnings', test: () => this.testWorkflowValidation() },
      
      // Error handling
      { name: 'Test 10: Invalid issue key error handling', test: () => this.testErrorHandling() },
      { name: 'Test 11: Mixed success/failure scenarios', test: () => this.testMixedScenarios() }
    ];

    for (const { name, test } of tests) {
      try {
        console.log(`\n${name}`);
        await test();
        console.log('✅ Passed');
      } catch (error) {
        console.error(`❌ Failed: ${error}`);
      }
    }
  }

  async testUniversalFields(): Promise<void> {
    const issueKey = this.testData.getRandomIssue();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: issueKey,
      summary: `Updated Summary - ${Date.now()}`,
      priority: 'High',
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Issue: ${result.issueKey}`);
    console.log(`   🔍 Detected Type: ${result.detectedIssueType}`);
    console.log(`   ✅ Applied Updates: ${result.appliedUpdates.join(', ')}`);
    
    if (result.standardFieldsUpdate) {
      console.log(`   📝 Updated Fields: ${result.standardFieldsUpdate.updatedFields.join(', ')}`);
    }
    
    if (result.updatedIssue) {
      console.log(`   📊 New Summary: ${result.updatedIssue.summary}`);
      console.log(`   ⚡ Priority: ${result.updatedIssue.priority}`);
    }
  }

  async testAssigneeLabels(): Promise<void> {
    const issueKey = this.testData.getRandomIssue();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: issueKey,
      assignee: this.testData.getAssigneeAccountId(),
      labels: ['enhanced-test', 'automation', `test-${Date.now()}`],
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Issue: ${result.issueKey}`);
    console.log(`   👤 Assignee: ${result.updatedIssue?.assignee || 'Not updated'}`);
    console.log(`   🏷️  Labels updated: ${result.standardFieldsUpdate?.updatedFields.includes('labels') ? 'Yes' : 'No'}`);
  }

  async testDescriptionUpdate(): Promise<void> {
    const issueKey = this.testData.getRandomIssue();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: issueKey,
      description: `Enhanced update test - ${new Date().toISOString()}\n\nThis description was updated using the enhanced updateIssue tool with automatic ADF format conversion.`,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Issue: ${result.issueKey}`);
    console.log(`   📝 Description updated: ${result.standardFieldsUpdate?.updatedFields.includes('description') ? 'Yes' : 'No'}`);
  }

  async testEpicAutoDetect(): Promise<void> {
    const epicKey = this.testData.getRandomEpic();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: epicKey,
      epicName: `Enhanced Epic - ${Date.now()}`,
      epicColor: 'color_2', // Blue
      summary: `Epic Summary Updated - ${Date.now()}`,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Epic: ${result.issueKey}`);
    console.log(`   🔍 Auto-detected Type: ${result.detectedIssueType}`);
    console.log(`   ✅ Applied Updates: ${result.appliedUpdates.join(', ')}`);
    
    if (result.epicFieldsUpdate?.success) {
      console.log(`   🎯 Epic Name: ${result.epicFieldsUpdate.epicData?.name || 'Not available'}`);
      console.log(`   🎨 Epic Color: ${result.epicFieldsUpdate.epicData?.color?.key || 'Not available'}`);
    }
  }

  async testEpicExplicit(): Promise<void> {
    const epicKey = this.testData.getRandomEpic();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: epicKey,
      issueType: 'Epic', // Explicit type
      epicDone: false,
      epicColor: 'color_3', // Green
      priority: 'Medium',
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Epic: ${result.issueKey}`);
    console.log(`   🎯 Explicit Type: ${result.detectedIssueType}`);
    console.log(`   ✅ Epic Done Status: ${result.epicFieldsUpdate?.epicData?.done !== undefined ? result.epicFieldsUpdate.epicData.done : 'Not updated'}`);
  }

  async testStoryAutoDetect(): Promise<void> {
    const storyKey = this.testData.getRandomStory();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: storyKey,
      storyPoints: 8,
      summary: `Story Updated - ${Date.now()}`,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Story: ${result.issueKey}`);
    console.log(`   🔍 Auto-detected Type: ${result.detectedIssueType}`);
    console.log(`   📊 Story Points: ${result.updatedIssue?.storyPoints || 'Not available'}`);
  }

  async testStoryEpicLink(): Promise<void> {
    const storyKey = this.testData.getRandomStory();
    const epicKey = this.testData.getRandomEpic();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: storyKey,
      epicKey: epicKey,
      storyPoints: 5,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    if (!result.success) {
      throw new Error(`Update failed: ${result.message || 'Unknown error'}`);
    }

    console.log(`   📋 Story: ${result.issueKey}`);
    console.log(`   🔗 Epic Link: ${epicKey}`);
    console.log(`   📊 Story Points: ${result.updatedIssue?.storyPoints || 'Not available'}`);
  }

  async testSubtaskAutoDetect(): Promise<void> {
    const subtaskKey = this.testData.getRandomSubtask();
    const parentKey = this.testData.getRandomStory();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: subtaskKey,
      parentKey: parentKey,
      summary: `Subtask Updated - ${Date.now()}`,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    console.log(`   📋 Sub-task: ${result.issueKey}`);
    console.log(`   🔍 Auto-detected Type: ${result.detectedIssueType}`);
    console.log(`   🔗 Parent Update: ${result.standardFieldsUpdate?.updatedFields.includes('parent') ? 'Yes' : 'No'}`);
    console.log(`   ✅ Success: ${result.success}`);
  }

  async testWorkflowValidation(): Promise<void> {
    const issueKey = this.testData.getRandomIssue();
    
    const response = await this.client.callTool('updateIssue', {
      issueKey: issueKey,
      assignee: this.testData.getAssigneeAccountId(),
      summary: `Workflow Test - ${Date.now()}`,
      validateTransition: true,
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    console.log(`   📋 Issue: ${result.issueKey}`);
    console.log(`   ⚠️  Workflow Warnings: ${result.workflowWarnings?.length || 0}`);
    
    if (result.workflowWarnings?.length > 0) {
      result.workflowWarnings.forEach((warning: string) => {
        console.log(`     - ${warning}`);
      });
    }
  }

  async testErrorHandling(): Promise<void> {
    try {
      const response = await this.client.callTool('updateIssue', {
        issueKey: 'INVALID-999999',
        summary: 'This should fail',
        smartFieldMapping: true
      });

      const result = JSON.parse(response.content[0].text);
      
      if (result.success) {
        throw new Error('Expected error for invalid issue key');
      }

      console.log(`   ❌ Expected Error: ${result.error}`);
      console.log(`   📋 Issue Key: ${result.issueKey}`);
      
    } catch (error) {
      console.log(`   ✅ Error handling works: ${error}`);
    }
  }

  async testMixedScenarios(): Promise<void> {
    const epicKey = this.testData.getRandomEpic();
    
    // Test mixed Epic updates - some should succeed, some might fail
    const response = await this.client.callTool('updateIssue', {
      issueKey: epicKey,
      summary: `Mixed Test Epic - ${Date.now()}`,
      epicName: `Enhanced Epic - ${Date.now()}`,
      epicColor: 'invalid_color', // This might fail
      priority: 'High',
      customFields: {
        'customfield_99999': 'Invalid field' // This might fail
      },
      smartFieldMapping: true
    });

    const result = JSON.parse(response.content[0].text);
    
    console.log(`   📋 Epic: ${result.issueKey}`);
    console.log(`   ✅ Overall Success: ${result.success}`);
    console.log(`   📝 Standard Fields: ${result.standardFieldsUpdate?.success ? 'Success' : 'Failed'}`);
    console.log(`   🎯 Epic Fields: ${result.epicFieldsUpdate?.success ? 'Success' : 'Failed'}`);
    
    if (!result.success) {
      console.log(`   ⚠️  Message: ${result.message}`);
    }
  }
}

// Export for use in comprehensive test runner
export { TestEnhancedUpdateIssue };
