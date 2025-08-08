# Code Style & Conventions

## TypeScript Configuration
- **Target**: ES2022
- **Module**: NodeNext with ESM imports
- **Strict**: true (full type checking)
- **File Extension**: .ts with .js imports (ESM)

## Project Conventions

### File Structure
- `src/index.ts` - Main server entry point
- `src/tools/jira/` - Individual tool implementations
- `src/utils/` - Shared utilities and API clients
- `src/schemas/` - Zod schemas for validation

### Naming Patterns
- **Tools**: camelCase (`createIssue`, `updateFilter`)
- **Files**: kebab-case (`create-issue.ts`, `jira-tool-api.ts`)
- **Interfaces**: PascalCase (`AtlassianConfig`, `JiraIssue`)
- **Constants**: UPPER_SNAKE_CASE (`ATLASSIAN_API_TOKEN`)

### Code Patterns
- **ESM imports**: Use .js extension in imports
- **Error handling**: Try-catch with proper MCP error responses
- **Logging**: Use Logger.getLogger() from utils/logger.ts
- **API calls**: Use axios with atlassian-api-base.ts utilities
- **Validation**: Zod schemas for tool parameters

### Tool Implementation Pattern
```typescript
export async function toolName(params: any, context: any) {
  try {
    // Parameter validation with Zod
    const validatedParams = schema.parse(params);
    
    // API call using context.atlassianConfig
    const response = await apiCall(validatedParams, context.atlassianConfig);
    
    // Return formatted response
    return { content: [{ type: 'text', text: result }] };
  } catch (error) {
    // Error handling with MCP format
    return { content: [{ type: 'text', text: error.message }], isError: true };
  }
}
```

### Git Commit Convention
- Format: `type: description` (NO emojis, NO AI attribution)
- Types: feat, fix, refactor, docs, test, chore
- Example: `feat: add listIssues tool for Jira API integration`