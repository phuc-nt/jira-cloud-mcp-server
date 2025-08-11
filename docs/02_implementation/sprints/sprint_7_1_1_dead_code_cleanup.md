# Sprint 7.1.1: Dead Code File Cleanup

## 🎯 Sprint Overview
**Duration:** 1 hour  
**Objective:** Remove unused tool files that are no longer imported or registered  
**Priority:** Code hygiene and bundle size optimization  
**Result Target:** Clean codebase with only active tools

---

## 🗂️ Dead Code Analysis

### Currently Unused Tool Files
Based on module imports analysis, these files exist but are NOT imported/used anywhere:

| File | Status | Replacement | Last Used |
|------|--------|-------------|-----------|
| `src/tools/jira/update-issue.ts` | ❌ Dead | `enhanced-update-issue.ts` | Phase 5 |
| `src/tools/jira/get-board-issues.ts` | ❌ Dead | `enhanced-get-board-issues.ts` | Phase 5 |
| `src/tools/jira/search-users.ts` | ❌ Dead | `universal-search-users.ts` | Phase 5 |
| `src/tools/jira/get-issue.ts` | ❌ Dead | `enhanced-get-issue.ts` | Sprint 7.1 |
| `src/tools/jira/search-issues.ts` | ❌ Dead | `enhanced-search-issues.ts` | Sprint 7.1 |
| `src/tools/jira/list-users.ts` | ❌ Dead | `universal-search-users.ts` | Sprint 7.1 |

### Verification Commands
```bash
# Verify files are not imported
grep -r "search-issues" src/modules/  # Should be empty
grep -r "get-issue['\"]" src/modules/ # Should be empty
grep -r "list-users" src/modules/     # Should be empty
grep -r "update-issue['\"]" src/modules/ # Should be empty
grep -r "get-board-issues" src/modules/ # Should be empty  
grep -r "search-users" src/modules/   # Should be empty
```

---

## 🧹 Implementation Tasks

### Task 1: Verify Dead Code Status (15 minutes)
**Objective:** Double-confirm files are truly unused

#### Verification Steps:
1. Check no module imports these files
2. Check no other tool files import these files
3. Check no test files reference these files
4. Verify enhanced replacements exist and work

### Task 2: Remove Dead Tool Files (30 minutes)
**Objective:** Delete unused files and clean references

#### Files to Remove:
```bash
rm src/tools/jira/update-issue.ts
rm src/tools/jira/get-board-issues.ts  
rm src/tools/jira/search-users.ts
rm src/tools/jira/get-issue.ts
rm src/tools/jira/search-issues.ts
rm src/tools/jira/list-users.ts
```

### Task 3: Update Tool Descriptions (15 minutes)
**Objective:** Ensure enhanced tools document ALL patterns from removed tools

#### Enhanced Tools to Update:

##### 1. enhanced-update-issue.ts
**Must document patterns from `update-issue.ts`:**
- Basic field updates (summary, description, priority)
- Single field updates vs batch updates
- Type-specific field handling that basic tool couldn't do
- Error handling patterns
- Validation patterns

##### 2. enhanced-get-board-issues.ts  
**Must document patterns from `get-board-issues.ts`:**
- Board-specific issue retrieval
- Status-based filtering 
- Pagination patterns
- Field selection patterns
- Sprint filtering that basic tool provided

##### 3. universal-search-users.ts
**Must document patterns from `list-users.ts` + `search-users.ts`:**
- List all users pattern (from listUsers)
- Search by query pattern (from searchUsers)
- Pagination for large user lists
- Filter by project/permission patterns
- Auto-detection between list vs search modes

##### 4. enhanced-search-issues.ts
**Must document patterns from `search-issues.ts`:**
- Basic JQL query patterns
- Field selection patterns
- Pagination patterns  
- Sort order specifications
- Simple vs complex query examples

##### 5. enhanced-get-issue.ts
**Must document patterns from `get-issue.ts`:**
- Basic issue retrieval by key
- Field expansion patterns
- Property selection
- Comment inclusion patterns
- Attachment handling

---

## 📋 Tool Description Template

Each enhanced tool must include comprehensive descriptions covering:

### Basic Usage Patterns
```typescript
/**
 * Enhanced [Tool Name] - Replaces: [list of replaced tools]
 * 
 * COMPREHENSIVE USAGE PATTERNS:
 * 
 * 1. BASIC PATTERNS (from replaced basic tool):
 *    - [specific examples from basic tool]
 *    - [parameter patterns]
 *    - [common use cases]
 * 
 * 2. ENHANCED PATTERNS (new capabilities):
 *    - [enhanced features]
 *    - [smart detection]
 *    - [automatic optimization]
 * 
 * 3. ALL SUPPORTED USE CASES:
 *    - [comprehensive list covering both basic + enhanced]
 *    - [migration examples from basic to enhanced]
 *    - [error handling patterns]
 * 
 * MIGRATION NOTE: This tool handles ALL patterns from [replaced tools] 
 * plus additional enhanced capabilities for better user experience.
 */
```

---

## ✅ Success Criteria

### File Cleanup
- ✅ All 6 dead code files removed
- ✅ No broken references in codebase
- ✅ Build still successful after cleanup
- ✅ No unused imports remain

### Documentation Quality
- ✅ Enhanced tools document ALL basic tool patterns
- ✅ Migration examples provided for each replaced pattern
- ✅ AI Client can understand all usage patterns
- ✅ No functionality gaps in documentation

### Code Hygiene
- ✅ Bundle size reduction measurable
- ✅ Tools directory contains only active files
- ✅ Clear separation between basic and enhanced patterns in docs

---

## 📊 Expected Impact

### Bundle Size Reduction
```
Before: 54 tool files (6 unused)
After:  48 tool files (0 unused)
Cleanup: -11% file count, estimated -8% bundle size
```

### Developer Experience
- **Clarity:** No confusion between basic/enhanced versions
- **Completeness:** All patterns documented in enhanced tools
- **Efficiency:** Smaller bundle, faster builds
- **Maintenance:** Less code to maintain

---

## 🚀 Preparation for Sprint 7.2

After Sprint 7.1.1 cleanup, remaining consolidation targets:

### Strategic Consolidation Candidates
1. **get-board-sprints.ts** + **list-sprints.ts** → Merge into unified sprint listing
2. **get-my-filters.ts** + **list-filters.ts** → Merge into unified filter discovery

### Active Tools Count Post-Cleanup
```
Total tools: 46 (current)
After 7.1.1: 46 (same functionality, cleaner codebase)  
After 7.2:   44 (strategic consolidation)
Final result: 10% reduction from Phase 6 baseline
```

---

**Sprint 7.1.1 Focus:** Perfect code hygiene with comprehensive enhanced tool documentation for optimal AI Client experience.