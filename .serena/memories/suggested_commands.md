# Development Commands

## Build & Development
```bash
npm run build          # Build TypeScript to dist/
npm run start          # Start MCP server (production)
npm run dev            # Start with nodemon + ts-node (development)
npm run prepublishOnly # Build before publishing
```

## Testing
```bash
cd test-client && npm test  # Run integration tests with MCP server
```

## Git Commands (macOS/Darwin)
```bash
git status                          # Check working directory status
git add .                          # Stage all changes
git commit -m "type: description"  # Commit with conventional format
git push                           # Push to remote
```

## File Operations (macOS/Darwin)
```bash
ls -la                 # List files with details
find . -name "*.ts"    # Find TypeScript files
grep -r "pattern" src/ # Search in source code
```

## Project Structure Commands
```bash
ls src/tools/jira/     # View available Jira tools
ls src/utils/          # View utility modules
cat package.json       # View project configuration
```

## Phase 2 Development
```bash
cd test-client && npm test  # Validate current tools
npm run build && npm run start  # Test production build
```