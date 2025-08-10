# Sprint 6.4: Search Module Optimization (18→16 tools)

## 🎯 Tổng quan
**Mục tiêu:** Tối ưu hóa Search Module bằng cách loại bỏ 2 tools trùng lặp và thay thế bằng enhanced versions.

**Thay đổi chính:**
- **Loại bỏ:** `searchUsers`, `listIssues` khỏi Search Module
- **Sử dụng:** `universalSearchUsers`, `enhancedSearchIssues` (đã có sẵn)
- **Kết quả:** 18→16 tools, API sạch hơn, hiệu suất tốt hơn

---

## 📋 Sub-Sprints

### Sprint 6.4.1: Enhanced Tool Verification (30min)
**Mục tiêu:** Xác nhận enhanced tools có thể thay thế hoàn toàn deprecated tools

**Tasks:**
- [ ] Test `universalSearchUsers` với all `searchUsers` use cases  
- [ ] Test `enhancedSearchIssues` với all `listIssues` use cases
- [ ] Confirm 100% feature parity
- [ ] Document any missing features

### Sprint 6.4.2: Search Module Updates (45min) 
**Mục tiêu:** Cập nhật Search Module loại bỏ deprecated tools

**Tasks:**
- [ ] Update `src/modules/search/tools/index.ts` - remove 2 tool imports/registrations
- [ ] Update `src/modules/search/index.ts` - toolCount: 18→16
- [ ] Build verification: `npm run build`
- [ ] Test: 16/16 tools pass trong Search Module

### Sprint 6.4.3: Test Suite Updates (30min)
**Mục tiêu:** Cập nhật test suite cho tool count mới

**Tasks:**
- [ ] Update `test-client/src/modules/test-search-module.ts`
- [ ] Remove `testSearchUsers()` và `testListIssues()` methods
- [ ] Update tool count expectations: 18→16
- [ ] Verify: 16/16 tests pass (100% success)

### Sprint 6.4.4: Documentation Updates (30min)
**Mục tiêu:** Cập nhật tất cả documentation references

**Tasks:**
- [ ] Update README.md - autoApprove lists, tool counts  
- [ ] Update START_POINT.md - module status
- [ ] Update deployment examples
- [ ] Create completion report

---

## 🎯 Success Criteria
- [ ] **Build Success:** All modules compile without errors
- [ ] **Test Success:** 16/16 Search Module tools pass  
- [ ] **No Regressions:** Other modules unaffected
- [ ] **Documentation:** All references updated correctly

---

## 🚨 Quality Gates
1. **Enhanced Tool Verification** - Must handle all original use cases
2. **Search Module Update** - Must achieve 16/16 (100% success)  
3. **System Integration** - No regressions in other modules
4. **Documentation Accuracy** - All tool counts updated

---

## 📊 Expected Results
- **Before:** 18 Search tools, 49/50 total working (98%)
- **After:** 16 Search tools, 47/48 total working (98%)
- **Benefits:** Cleaner API, better UX, enhanced algorithms

---

**Estimated Duration:** 2.5 hours  
**Success Rate:** High (with proper verification)

*Created: August 10, 2025*