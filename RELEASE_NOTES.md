# MCP Atlassian Server 2.1.0

🚀 **Major refactor: Standardized resource/tool structure, removed content-metadata resource, updated developer documentation!**

Available on npm (@phuc-nt/mcp-atlassian-server) or download directly. Use with Cline or any MCP-compatible client.

---

### Updates in 2.1.0

**Refactor & Standardization**
- Refactored the entire codebase to standardize resource/tool structure, completely removed the content-metadata resource, and merged metadata into the page resource.
- Updated and standardized developer documentation, making it easy for any developer to extend and maintain.
- Ensured compatibility with the latest MCP SDK, improved security, scalability, and maintainability.
- Updated `docs/introduction/resources-and-tools.md` to remove all references to content-metadata.

**Bug Fixes**
- Fixed duplicate resource registration issues for a more stable experience
- Improved resource management and registration process
- Resolved issues with conflicting resource patterns

**Documentation Series**
- Added comprehensive documentation series:
  1. MCP Overview & Architecture: Core concepts and design principles
  2. MCP Tools & Resources Development: How to develop and extend resources/tools
  3. MCP Prompts & Sampling: Guide for prompt engineering with MCP
- Updated installation guide and client development documentation
- Enhanced resource and tool descriptions

**Core Features**
**Jira Information Access**
- View issues, projects, users, comments, transitions, assignable users
- Access boards, sprints, filters, dashboards and gadgets
- Search issues with powerful filter tools

**Jira Actions**
- Create, update, transition, assign issues
- Manage boards and sprints for Agile/Scrum workflows
- Create/update dashboards, add/remove gadgets
- Create, update, and delete filters

**Confluence Information Access**
- View spaces, pages, child pages, details, comments, labels
- Access page versions and attachments
- View and search comments

**Confluence Actions**
- Create and update pages, add/remove labels, add comments
- Manage page versions, upload/download attachments
- Update and delete comments
- Delete pages

---

**How to use:**  
1. Install from npm: `npm install -g @phuc-nt/mcp-atlassian-server`
2. Point Cline config to the installed package.
3. Set your Atlassian API credentials.
4. Start using natural language to work with Jira & Confluence!

See [README.md](https://github.com/phuc-nt/mcp-atlassian-server) and the new documentation series for full instructions.  
Feedback and contributions are welcome! 🚀

## What's Changed
* Fixed resource registration to prevent duplicates
* Improved server stability and resource management
* Added comprehensive documentation series in `docs/knowledge/`
* Enhanced development guide for client integrations
* Updated resource structure for better organization

**Previous Changelog (2.0.0)**: 
* Updated to latest Atlassian APIs (Jira API v3, Confluence API v2)
* Redesigned resource and tool structure for better organization
* Expanded Jira capabilities with board, sprint, dashboard, and filter management
* Enhanced Confluence features with advanced page operations and comment management

**Full Changelog**: https://github.com/phuc-nt/mcp-atlassian-server/blob/main/CHANGELOG.md 