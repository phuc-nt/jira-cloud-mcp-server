# Sprint 7.2: Strategic Tool Consolidation

## 🎯 Sprint Overview
**Duration:** 4 hours  
**Objective:** Merge similar tools into unified interfaces for better API design  
**Priority:** API simplification with enhanced functionality  
**Result Target:** 46 → 44 tools (strategic 2-tool reduction)

---

## 🔄 Consolidation Strategy

### Target Consolidations

#### 1. Sprint Listing Unification
**Target:** `get-board-sprints.ts` + `list-sprints.ts` → **Enhanced `list-sprints.ts`**

**Analysis:**
- `get-board-sprints`: Board-specific sprint listing
- `list-sprints`: General sprint listing with optional board filter
- **Opportunity:** listSprints can handle board-specific queries with boardId parameter

**Approach:**
- Enhance `list-sprints.ts` to detect when boardId is provided
- Add board-specific optimization paths
- Maintain all current functionality from both tools
- Remove `get-board-sprints.ts` after migration

#### 2. Filter Discovery Unification  
**Target:** `get-my-filters.ts` + `list-filters.ts` → **Enhanced `list-filters.ts`**

**Analysis:**
- `get-my-filters`: User-specific filter listing  
- `list-filters`: General filter listing with various filters
- **Opportunity:** listFilters can include "owner=currentUser" pattern

**Approach:**
- Enhance `list-filters.ts` to support owner-based filtering
- Add "my filters" detection and optimization
- Maintain backward compatibility for both patterns
- Remove `get-my-filters.ts` after migration

---

## 🛠️ Implementation Tasks

### Phase A: Sprint Listing Consolidation (2 hours)

#### Task A.1: Analyze Current Usage Patterns (30 minutes)
**Objective:** Understand how both sprint tools are currently used

**Investigation:**
1. Check `get-board-sprints.ts` parameters and response format
2. Check `list-sprints.ts` parameters and response format  
3. Identify overlap and unique capabilities
4. Map migration paths for each usage pattern

#### Task A.2: Enhance list-sprints.ts (60 minutes)
**Objective:** Add board-specific optimization to list-sprints

**Implementation:**
```typescript
export const listSprintsSchema = z.object({
  boardId: z.number().optional().describe('Board ID for board-specific sprints (replaces get-board-sprints)'),
  state: z.enum(['active', 'closed', 'future']).optional().describe('Sprint state filter'),
  startAt: z.number().optional().describe('Pagination start'),
  maxResults: z.number().optional().describe('Max results per page')
});

/**
 * Enhanced List Sprints - Replaces: get-board-sprints.ts + original list-sprints.ts
 * 
 * COMPREHENSIVE USAGE PATTERNS:
 * 
 * 1. BOARD-SPECIFIC PATTERNS (from get-board-sprints):
 *    - Get all sprints for a specific board: { boardId: 123 }
 *    - Board sprints with state filter: { boardId: 123, state: 'active' }
 *    - Board sprint pagination: { boardId: 123, startAt: 0, maxResults: 50 }
 * 
 * 2. GENERAL PATTERNS (from list-sprints):  
 *    - List all sprints: {} (no parameters)
 *    - Filter by state: { state: 'active' }
 *    - Paginated listing: { startAt: 0, maxResults: 100 }
 * 
 * 3. SMART DETECTION:
 *    - When boardId provided → uses board-specific Agile API endpoint
 *    - When boardId omitted → uses general sprint search endpoint
 *    - Automatic optimization based on parameters
 * 
 * MIGRATION EXAMPLES:
 * - get-board-sprints(boardId: 123) → list-sprints({ boardId: 123 })
 * - list-sprints() → list-sprints({}) (unchanged)
 */
```

#### Task A.3: Update Agile Module Registration (15 minutes)
**File:** `src/modules/agile/tools/index.ts`

**Changes:**
- Remove `registerGetBoardSprintsTool` import and registration
- Update tool count: 10 → 9
- Update comments and numbering

#### Task A.4: Remove get-board-sprints.ts (15 minutes)
**Actions:**
- Delete `src/tools/jira/get-board-sprints.ts`
- Verify no references remain in codebase

---

### Phase B: Filter Discovery Consolidation (2 hours)

#### Task B.1: Analyze Filter Usage Patterns (30 minutes)
**Investigation:**
1. Check if `get-my-filters.ts` is actually used in any modules
2. Analyze `list-filters.ts` current capabilities
3. Design unified parameter schema

#### Task B.2: Enhance list-filters.ts (60 minutes)
**Objective:** Add "my filters" capability to list-filters

**Implementation:**
```typescript
export const listFiltersSchema = z.object({
  owner: z.string().optional().describe('Filter owner (use "me" for current user filters, replaces get-my-filters)'),
  favourite: z.boolean().optional().describe('Only favourite filters'),
  expand: z.string().optional().describe('Expand filter details'),
  startAt: z.number().optional().describe('Pagination start'),
  maxResults: z.number().optional().describe('Max results per page')
});

/**
 * Enhanced List Filters - Replaces: get-my-filters.ts + original list-filters.ts
 * 
 * COMPREHENSIVE USAGE PATTERNS:
 * 
 * 1. MY FILTERS PATTERNS (from get-my-filters):
 *    - Get current user's filters: { owner: "me" }
 *    - My favourite filters: { owner: "me", favourite: true }
 *    - My filters with details: { owner: "me", expand: "description,jql" }
 * 
 * 2. GENERAL FILTER PATTERNS (from list-filters):
 *    - List all accessible filters: {} (no parameters)
 *    - Filters by specific owner: { owner: "username" }
 *    - Only favourite filters: { favourite: true }
 *    - Paginated listing: { startAt: 0, maxResults: 50 }
 * 
 * 3. SMART DETECTION:
 *    - owner: "me" → uses /filter/my endpoint (optimized)
 *    - owner: "username" → uses /filter/search with owner filter
 *    - no owner → uses general /filter endpoint
 * 
 * MIGRATION EXAMPLES:
 * - get-my-filters() → list-filters({ owner: "me" })
 * - list-filters() → list-filters({}) (unchanged)
 */
```

#### Task B.3: Update Module Registration (15 minutes)
**Check which module uses get-my-filters and update accordingly**

#### Task B.4: Remove get-my-filters.ts (15 minutes)
**Actions:**
- Delete `src/tools/jira/get-my-filters.ts` if not used
- Verify no references remain in codebase

---

## 📊 Module Impact Analysis

### Agile Module Changes
```typescript
// Before Sprint 7.2
registerGetBoardSprintsTool(server);         // 9. Board sprints list
registerListSprintsTool(server);             // In Search module

// After Sprint 7.2  
// Enhanced listSprints handles both patterns (moved to Agile module)
registerEnhancedListSprintsTool(server);     // 9. Unified sprint listing
```

### Search Module Changes
```typescript
// Before Sprint 7.2
registerListFiltersTool(server);             // 10. Filter discovery
registerGetMyFiltersTool(server);            // If exists

// After Sprint 7.2
registerEnhancedListFiltersTool(server);     // 10. Unified filter discovery
```

---

## 🧪 Testing & Verification

### Consolidation Testing
**Sprint Listing:**
1. Test board-specific sprint retrieval: `{ boardId: 123 }`
2. Test general sprint listing: `{}`
3. Test pagination with board filter
4. Verify performance optimization paths

**Filter Discovery:**
1. Test "my filters" pattern: `{ owner: "me" }`
2. Test specific owner filter: `{ owner: "username" }`  
3. Test general filter listing: `{}`
4. Verify endpoint optimization

### Backward Compatibility
- All previous use cases must work with new parameters
- Response formats remain consistent
- Performance should improve with optimized endpoints

---

## 📋 Tool Description Quality Standards

Each consolidated tool must document:

### Pattern Coverage Matrix
```markdown
| Use Case | Old Tool | New Parameter Pattern | Status |
|----------|----------|----------------------|---------|
| Board sprints | get-board-sprints | { boardId: N } | ✅ Full parity |
| All sprints | list-sprints | {} | ✅ Enhanced |
| My filters | get-my-filters | { owner: "me" } | ✅ Full parity |
| All filters | list-filters | {} | ✅ Enhanced |
```

### AI Client Guidelines
- **Complete Examples:** Every pattern must have usage example
- **Migration Path:** Clear migration from old to new syntax
- **Error Handling:** Document all error scenarios
- **Performance Notes:** When optimizations kick in

---

## ✅ Success Criteria

### Functional Requirements
- ✅ All old functionality preserved in consolidated tools
- ✅ Enhanced capabilities provide better performance
- ✅ Zero breaking changes for existing usage patterns
- ✅ Smart parameter detection works correctly

### Code Quality
- ✅ Tool count reduced: 46 → 44 tools
- ✅ API surface simplified and more intuitive
- ✅ Enhanced tools fully documented with all patterns
- ✅ Build and tests pass successfully

### Documentation Quality
- ✅ AI Client can understand all usage patterns
- ✅ Migration examples clear and comprehensive
- ✅ No functionality gaps in consolidated tools
- ✅ Pattern detection logic clearly explained

---

## 📊 Final Phase 7 Results

```
Phase 6 Baseline: 49 tools
Sprint 7.1:       46 tools (-3 redundant basic tools)  
Sprint 7.1.1:     46 tools (dead code cleanup, same count)
Sprint 7.2:       44 tools (-2 strategic consolidations)

Total Reduction:  49 → 44 tools (10% improvement)
Quality Gains:    Enhanced functionality, cleaner API, better AI Client experience
```

---

**Sprint 7.2 Focus:** Strategic API unification with comprehensive pattern documentation for superior AI Client integration.