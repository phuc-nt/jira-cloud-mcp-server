# MCP Atlassian Server Project Overview

## Project Purpose
MCP Atlassian Server v3.0.0 - A simplified MCP server enabling AI assistants to interact with Jira using tools-only architecture. This is a major refactor from v2.1.1 (dual Jira+Confluence with resources+tools) to v3.0.0 (Jira-only with tools-only).

## Current Status
- **Phase 1 COMPLETE** ✅ Foundation cleanup finished (~45% code reduction)
- **Phase 2 READY** 🚀 Tools-only transformation ready to start
- **Working Tools**: 18 Jira tools operational

## Tech Stack
- **Language**: TypeScript (Node.js 16+)  
- **Protocol**: Model Context Protocol (MCP)
- **API**: Jira API v3
- **Auth**: Basic Auth with API tokens
- **Dependencies**: @modelcontextprotocol/sdk, axios, zod, jira.js
- **Dev Stack**: ts-node, nodemon, jest

## Architecture
- **Current**: Tools-only MCP server (resources removed in Phase 1)
- **Pattern**: Direct tool registration, simplified initialization
- **Goal**: 25 Jira tools covering read/write operations

## Key Directories
- `src/index.ts` - MCP server initialization (tools-only)  
- `src/tools/jira/` - 18 working Jira tools
- `src/utils/` - API clients and helpers
- `src/schemas/` - Zod schemas for validation
- `test-client/` - Integration testing
- `docs/` - Phase planning and implementation tracking