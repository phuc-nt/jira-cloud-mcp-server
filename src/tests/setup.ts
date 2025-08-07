/**
 * Test setup configuration
 * Sets up global test environment and utilities
 */

// Mock environment variables for testing
process.env.NODE_ENV = 'test';
process.env.ATLASSIAN_SITE_NAME = 'test-site.atlassian.net';
process.env.ATLASSIAN_USER_EMAIL = 'test@example.com';
process.env.ATLASSIAN_API_TOKEN = 'test-token';
process.env.MCP_SERVER_NAME = 'test-mcp-server';
process.env.MCP_SERVER_VERSION = '3.0.0-test';

// Simple console suppression for tests
if (process.env.NODE_ENV === 'test') {
  const noop = () => {};
  console.log = noop;
  console.warn = noop;
  console.error = noop;
}