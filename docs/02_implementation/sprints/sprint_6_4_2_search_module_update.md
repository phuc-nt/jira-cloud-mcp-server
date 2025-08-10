# Sprint 6.4.2: Search Module Updates

## 🎯 Mục tiêu  
Loại bỏ 2 deprecated tools khỏi Search Module và cập nhật tool count.

## 📋 Implementation Tasks

### Task 1: Update Tools Registration (20min)
**File:** `src/modules/search/tools/index.ts`
```typescript
// REMOVE these imports:
import { registerListIssuesTool } from '../../../tools/jira/list-issues.js';
import { registerSearchUsersTool } from '../../../tools/jira/search-users.js';

// REMOVE these registrations:
registerListIssuesTool(server);     // Line ~41
registerSearchUsersTool(server);    // Line ~50

// UPDATE comment:
* 16 Advanced Search & Discovery Tools - SPRINT 6.4 OPTIMIZED
```

### Task 2: Update Module Configuration (10min)
**File:** `src/modules/search/index.ts`
```typescript
// UPDATE:
toolCount: 16  // Changed from 18
```

### Task 3: Build & Test Verification (15min)
```bash
npm run build                                    # Must succeed
cd test-client
npx tsx src/modules/test-search-module.ts        # 16/16 expected
```

## ✅ Success Criteria
- [ ] Search Module builds without errors
- [ ] Tool count correctly shows 16
- [ ] 16/16 tools pass all tests (100%)
- [ ] No compilation errors

## 🔄 Rollback Plan
```bash
git revert <commit-hash> --no-edit
npm run build && cd test-client && npx tsx src/modules/test-search-module.ts
# Expected: 18/18 tools restored
```

*Duration: 45 minutes*