import fs from 'fs';
import path from 'path';

// Interface definitions for type safety
interface TestProject {
  key: string;
  name: string;
  id: string;
}

interface TestBoard {
  id: number;
  name: string;
  type: string;
  projectKey: string;
  url: string;
}

interface TestSprint {
  boardId: number;
  name: string;
  state: string;
}

interface TestUser {
  accountId: string;
  displayName: string;
  emailAddress: string;
}

interface TestUsers {
  adminUser: TestUser;
}

interface TestIssues {
  sampleIssueKey: string;
  issueType: string;
  priority: string;
}

interface TestFilters {
  sampleFilterName: string;
  jqlQuery: string;
}

interface TestDashboards {
  sampleDashboardName: string;
  description: string;
}

interface JiraTestData {
  baseUrl: string;
  testProject: TestProject;
  testBoard: TestBoard;
  testSprint: TestSprint;
  testUsers: TestUsers;
  testIssues: TestIssues;
  testFilters: TestFilters;
  testDashboards: TestDashboards;
}

interface TestLimits {
  maxResults: number;
  maxTestIssues: number;
  maxTestUsers: number;
  maxTestFilters: number;
  maxTestDashboards: number;
}

interface Timeouts {
  defaultTimeout: number;
  longOperationTimeout: number;
}

interface RetrySettings {
  maxRetries: number;
  retryDelay: number;
}

interface Cleanup {
  autoCleanup: boolean;
  cleanupPrefix: string;
  cleanupTimeout: number;
}

interface TestConfiguration {
  limits: TestLimits;
  timeouts: Timeouts;
  retrySettings: RetrySettings;
  cleanup: Cleanup;
}

interface ExpectedResults {
  minProjects: number;
  minUsers: number;
  minBoards: number;
  expectedTools: number;
  targetSuccessRate: number;
}

interface EnvironmentSettings {
  testMode: boolean;
  verboseLogging: boolean;
  createTestData: boolean;
  useRealData: boolean;
}

interface TestDataConfig {
  jira: JiraTestData;
  testConfiguration: TestConfiguration;
  expectedResults: ExpectedResults;
  environmentSettings: EnvironmentSettings;
}

// Configuration Manager Class
export class ConfigManager {
  private static instance: ConfigManager;
  private config: TestDataConfig;
  private configPath: string;

  private constructor() {
    this.configPath = path.resolve(process.cwd(), 'test-data-config.json');
    this.config = this.loadConfig();
  }

  public static getInstance(): ConfigManager {
    if (!ConfigManager.instance) {
      ConfigManager.instance = new ConfigManager();
    }
    return ConfigManager.instance;
  }

  private loadConfig(): TestDataConfig {
    try {
      const configData = fs.readFileSync(this.configPath, 'utf8');
      return JSON.parse(configData) as TestDataConfig;
    } catch (error) {
      console.error('Error loading test data configuration:', error);
      throw new Error(`Failed to load test configuration from ${this.configPath}`);
    }
  }

  public reloadConfig(): void {
    this.config = this.loadConfig();
  }

  // Getters for various configuration sections
  public getJiraConfig(): JiraTestData {
    return this.config.jira;
  }

  public getTestProject(): TestProject {
    return this.config.jira.testProject;
  }

  public getTestBoard(): TestBoard {
    return this.config.jira.testBoard;
  }

  public getTestSprint(): TestSprint {
    return this.config.jira.testSprint;
  }

  public getTestUsers(): TestUsers {
    return this.config.jira.testUsers;
  }

  public getTestConfiguration(): TestConfiguration {
    return this.config.testConfiguration;
  }

  public getExpectedResults(): ExpectedResults {
    return this.config.expectedResults;
  }

  public getEnvironmentSettings(): EnvironmentSettings {
    return this.config.environmentSettings;
  }

  // Convenience methods for commonly used values
  public getProjectKey(): string {
    return this.config.jira.testProject.key;
  }

  public getBoardId(): number {
    return this.config.jira.testBoard.id;
  }

  public getAdminUser(): TestUser {
    return this.config.jira.testUsers.adminUser;
  }

  public getDefaultJQL(): string {
    return this.config.jira.testFilters.jqlQuery;
  }

  public getMaxResults(): number {
    return this.config.testConfiguration.limits.maxResults;
  }

  public getDefaultTimeout(): number {
    return this.config.testConfiguration.timeouts.defaultTimeout;
  }

  public shouldUseRealData(): boolean {
    return this.config.environmentSettings.useRealData;
  }

  public isVerboseLogging(): boolean {
    return this.config.environmentSettings.verboseLogging;
  }

  public shouldAutoCleanup(): boolean {
    return this.config.testConfiguration.cleanup.autoCleanup;
  }

  public getCleanupPrefix(): string {
    return this.config.testConfiguration.cleanup.cleanupPrefix;
  }

  // Test data generation helpers
  public generateTestName(base: string): string {
    const timestamp = Date.now();
    const prefix = this.getCleanupPrefix();
    return `${prefix}${base}-${timestamp}`;
  }

  public generateTestDescription(purpose: string): string {
    const timestamp = new Date().toISOString();
    return `Test ${purpose} created by MCP Test Suite at ${timestamp}`;
  }

  // Validation methods
  public validateConfiguration(): boolean {
    try {
      // Validate required fields
      if (!this.config.jira.baseUrl) {
        throw new Error('Jira base URL is required');
      }

      if (!this.config.jira.testProject.key) {
        throw new Error('Test project key is required');
      }

      if (!this.config.jira.testBoard.id) {
        throw new Error('Test board ID is required');
      }

      if (!this.config.jira.testUsers.adminUser.accountId) {
        throw new Error('Admin user account ID is required');
      }

      // Validate numeric values
      if (this.config.jira.testBoard.id <= 0) {
        throw new Error('Board ID must be a positive number');
      }

      if (this.config.testConfiguration.limits.maxResults <= 0) {
        throw new Error('Max results must be a positive number');
      }

      if (this.config.expectedResults.expectedTools !== 45) {
        console.warn('Expected tools count is not 45, current implementation has 45 tools');
      }

      return true;
    } catch (error) {
      console.error('Configuration validation failed:', error);
      return false;
    }
  }

  // Debug and utility methods
  public printConfiguration(): void {
    console.log('=== Test Data Configuration ===');
    console.log(`Jira Base URL: ${this.config.jira.baseUrl}`);
    console.log(`Test Project: ${this.config.jira.testProject.name} (${this.config.jira.testProject.key})`);
    console.log(`Test Board: ${this.config.jira.testBoard.name} (ID: ${this.config.jira.testBoard.id})`);
    console.log(`Test Sprint: ${this.config.jira.testSprint.name}`);
    console.log(`Admin User: ${this.config.jira.testUsers.adminUser.displayName}`);
    console.log(`Max Results: ${this.config.testConfiguration.limits.maxResults}`);
    console.log(`Expected Tools: ${this.config.expectedResults.expectedTools}`);
    console.log(`Target Success Rate: ${this.config.expectedResults.targetSuccessRate * 100}%`);
    console.log(`Use Real Data: ${this.config.environmentSettings.useRealData}`);
    console.log(`Auto Cleanup: ${this.config.testConfiguration.cleanup.autoCleanup}`);
    console.log('===============================');
  }

  // Export configuration for external tools
  public exportConfiguration(): TestDataConfig {
    return JSON.parse(JSON.stringify(this.config));
  }
}

// Convenience function to get the singleton instance
export function getTestConfig(): ConfigManager {
  return ConfigManager.getInstance();
}

// Type exports for use in other files
export type {
  TestDataConfig,
  JiraTestData,
  TestProject,
  TestBoard,
  TestSprint,
  TestUser,
  TestUsers,
  TestConfiguration,
  ExpectedResults,
  EnvironmentSettings
};