# Sprint 6.1: Core Infrastructure & Base Module
**Phase 6 - Day 1: Modular Architecture Foundation**

## 🎯 Sprint Goals
- Tạo shared core infrastructure cho modular architecture  
- Implement Core module với 12 essential CRUD tools
- Establish base patterns cho remaining modules

## 📋 Tasks Breakdown

### Task 1: Core Infrastructure Setup (Est: 90min)
- [ ] Tạo `src/core/server-base.ts` - Base MCP server class
- [ ] Tạo `src/core/utils/` - Shared utilities 
- [ ] Define common interfaces và types cho modules
- [ ] Setup build configuration cho multiple entry points

### Task 2: Core Module Implementation (Est: 120min) 
- [ ] Tạo `src/modules/core/` folder structure
- [ ] Implement `src/modules/core/index.ts` - Entry point
- [ ] Move 12 core tools to `src/modules/core/tools/`:
  - Issue CRUD: createIssue, updateIssue, deleteIssue, transitionIssue, assignIssue
  - Comments: addIssueComment, updateIssueComment  
  - Filters: createFilter, updateFilter, deleteFilter
  - Versions: createFixVersion, updateFixVersion

### Task 3: Build System Configuration (Est: 60min)
- [ ] Update `package.json` với multiple build targets
- [ ] Configure TypeScript cho modular build
- [ ] Setup separate entry points: `dist/core.js`
- [ ] Test build process với Core module only

### Task 4: Testing & Validation (Est: 30min)
- [ ] Test Core module standalone functionality  
- [ ] Verify 12 tools registration và operation
- [ ] Memory usage measurement vs monolithic
- [ ] Documentation cho Core module usage

## ✅ Success Criteria
- Core module builds successfully to `dist/core.js`
- All 12 core tools functional khi run standalone
- Memory reduction ~75% compared to full 48 tools
- Foundation ready cho remaining 3 modules

## 🔄 Dependencies & Blockers
- **Requires**: Clean codebase sau facade removal
- **Blocks**: Sprint 6.2 (Agile/Dashboard modules)

## 📊 Module Core Tools (12 total)

### Issue Operations (7 tools)
1. `createIssue` - Create new issues with full field support
2. `updateIssue` - Update issue fields và custom properties  
3. `deleteIssue` - Delete issues with validation
4. `transitionIssue` - Move issues through workflow states
5. `assignIssue` - Assign issues to users
6. `addIssueComment` - Add comments to issues
7. `updateIssueComment` - Edit existing comments

### Filter Management (3 tools)  
8. `createFilter` - Create saved JQL filters
9. `updateFilter` - Modify existing filters
10. `deleteFilter` - Remove filters with ownership check

### Version Management (2 tools)
11. `createFixVersion` - Create project versions
12. `updateFixVersion` - Update version details

## 🎯 Architecture Benefits
- **Minimal Core**: Chỉ essential CRUD operations
- **No Read Overhead**: Không include read-only tools  
- **Focused Purpose**: Pure data modification module
- **Memory Efficient**: 75% reduction từ full server