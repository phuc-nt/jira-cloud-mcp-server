# MCP Atlassian Server (by phuc-nt) - Learning Guide

This guide helps you understand and learn how to use the MCP Atlassian Server, a Model Context Protocol server that connects AI agents to Atlassian's Jira and Confluence platforms.

## 1. Introduction to MCP Atlassian Server

The MCP Atlassian Server is a bridge between AI assistants (like Cline AI) and Atlassian tools (Jira and Confluence). It enables AI-powered natural language interaction with your project management and knowledge base systems.

**Project goals:**
- Provide a standardized MCP interface for Atlassian tools
- Enable AI agents to query data (Resources) and perform actions (Tools)
- Optimize for local development environments
- Seamless integration with Cline AI assistant

> **Note:** For a complete project overview, see the [README.md](./README.md) which includes architecture diagrams, feature tables, and usage scenarios.

## 2. Getting Started

### Prerequisites
- Node.js v14+ and npm
- Git
- Atlassian Cloud account and API token
- Cline AI assistant (optional, for testing as an MCP client)

> **Note:** For detailed installation instructions formatted for AI assistants, see [llms-install.md](./llms-install.md) which provides step-by-step guidance tailored for LLMs to follow.

### Quick Setup
```bash
# Clone and install
git clone https://github.com/phuc-nt/mcp-atlassian-server.git
cd mcp-atlassian-server
npm install

# Build the project
npm run build

# Run the server
npm start
```

### Configuration
The server requires Atlassian credentials which can be provided as environment variables:
```bash
export ATLASSIAN_SITE_NAME="your-site.atlassian.net"
export ATLASSIAN_USER_EMAIL="your-email@example.com"
export ATLASSIAN_API_TOKEN="your-api-token"
```

## 3. Learning the Codebase

### Project Structure
```
/ (root)
├── src/
│   ├── index.ts        # Entry point for the MCP server
│   ├── resources/      # Definitions for read-only data endpoints
│   ├── tools/          # Definitions for action-based endpoints 
│   └── utils/          # Shared utilities and helper functions
├── docs/
│   ├── dev-guide/      # Developer documentation
│   ├── plan/           # Roadmap and planning documents
│   └── test-reports/   # Test reports and findings
└── tests/              # Automated tests
```

### Key Concepts

1. **Resources vs Tools**
   - Resources: Read-only data access (e.g., listing Jira issues)
   - Tools: Actions that modify data (e.g., creating an issue)

2. **MCP Protocol**
   - Standard interface for AI agents to interact with external systems
   - Request/response format optimized for AI consumption

3. **Integration with Cline**
   - Configuration via `cline_mcp_settings.json`
   - Natural language interaction patterns

> For implementation details, explore the source code in the `src/` directory.

## 4. Examples and Learning Exercises

### Basic Usage with Cline AI

1. Configure Cline to use this MCP server (see [llms-install.md](./llms-install.md))
2. Ask questions like:
   - "List all issues assigned to me in Jira"
   - "Create a new issue in project DEMO about login bug"
   - "Find all Confluence pages about API documentation"

## 5. Development and Contribution

If you're interested in contributing to this project:

1. Look at existing issues or create new ones for features/bugs

## 6. Project Documentation

> **Note:** The following documentation is currently available in Vietnamese. English translations will be added soon.

### Introduction Documents

- [Resources and Tools Reference](./docs/introduction/resources-and-tools.md) - Comprehensive guide to all available Jira and Confluence resources and tools, their parameters, response formats, and usage examples.
- [Marketplace Submission Guide](./docs/introduction/marketplace-submission.md) - Documentation on preparing and submitting the server to MCP marketplace platforms.

### Knowledge Base

- [AI-Atlassian Integration](./docs/knowledge/ai-atlassian-integration.md) - Deep dive into connecting AI systems with Atlassian platforms, including challenges, solutions, and best practices.
- [Building MCP Servers](./docs/knowledge/building-mcp-server.md) - Detailed architectural guide on designing and implementing Model Context Protocol servers.
- [Resource and Tool Architecture](./docs/knowledge/resource-and-tool-architecture.md) - Technical explanation of the architecture behind resources (read-only endpoints) and tools (action endpoints).

## 7. Additional Resources

- [Atlassian API Documentation](https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/)
- [MCP Protocol Specification](https://modelcontextprotocol.io/specification/2025-03-26)