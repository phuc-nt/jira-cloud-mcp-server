# Task Completion Checklist

## After Completing Any Code Task

### 1. Build Validation
```bash
npm run build  # Must succeed without errors
```

### 2. Integration Testing
```bash
cd test-client && npm test  # Validate MCP server functionality
```

### 3. Code Quality Checks
- [ ] TypeScript compilation successful
- [ ] No console.log statements (use Logger instead)
- [ ] Proper error handling with try-catch
- [ ] MCP response format followed

### 4. Documentation Updates
- [ ] Update sprint documents if completing phase tasks
- [ ] Update START_POINT.md for major milestones  
- [ ] Add tool documentation if new tools created

### 5. Git Workflow (if approved by user)
```bash
git add .
git commit -m "type: description"  # NO emojis, NO AI attribution
# Do NOT push without explicit user request
```

## Phase 2 Specific Checklist

### Tool Conversion Tasks
- [ ] Original resource functionality preserved
- [ ] Zod schema validation implemented
- [ ] Consistent response format: `{ content: [...], isError?: boolean }`
- [ ] Error handling with proper MCP format
- [ ] Integration test passing

### Sprint Completion  
- [ ] All sprint tasks completed
- [ ] Test suite passing (18/18 or target count)
- [ ] Performance validation (<500ms average)
- [ ] Sprint completion report updated
- [ ] Next sprint planning document ready

## Critical Requirements
- **NEVER** commit without user approval
- **ALWAYS** run build + test before marking task complete
- **FOLLOW** conventional commit format (no emojis/AI attribution)