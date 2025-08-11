# Epic Search API Analysis Report

## 🔍 Báo cáo chi tiết API Endpoints và Custom Fields

Dựa trên kết quả test từ AI Client và phân tích source code, tôi đã xác định được vấn đề với Epic search.

---

## 📊 API Endpoints được sử dụng

### 1. **enhancedSearchIssues Tool**
**Primary Endpoint:** `POST /rest/api/3/search`

**JQL Generation Logic:**
```typescript
// File: src/tools/jira/enhanced-search-issues.ts
// Lines 113-123: Epic-specific filters

if (params.epicName) {
  jqlParts.push(`"Epic Name" ~ "${params.epicName}"`);  // ❌ PROBLEM
}

if (params.epicKey) {
  jqlParts.push(`"Epic Link" = "${params.epicKey}"`);  // ❌ PROBLEM  
}
```

### 2. **Enhanced Custom Field Mapping**
**File:** `src/tools/jira/enhanced-search-issues.ts`
**Lines 360-361:** Hierarchy fields mapping
```typescript
const hierarchyFields = 'parent,subtasks,customfield_10011,customfield_10014';
// Epic Link: customfield_10011  
// Epic Name: customfield_10014
```

---

## 🚨 Vấn đề được xác định

### **Root Cause: Custom Field ID Mapping Sai**

**1. Epic Name Search (epicName parameter)**
- **Generated JQL:** `"Epic Name" ~ "Epic test MCP Jira tool"`
- **Vấn đề:** Sử dụng field name `"Epic Name"` thay vì custom field ID
- **Thực tế:** Epic Name được lưu trong `customfield_10014`
- **JQL đúng:** `customfield_10014 ~ "Epic test MCP Jira tool"`

**2. Epic Link Search (epicKey parameter)** 
- **Generated JQL:** `"Epic Link" = "XDEMO2-260"`
- **Vấn đề:** Sử dụng field name `"Epic Link"` thay vì custom field ID
- **Thực tế:** Epic Link được lưu trong `customfield_10011`
- **JQL đúng:** `customfield_10011 = "XDEMO2-260"`

---

## 📋 Detailed API Analysis

### **Working Scenarios:**

#### ✅ **Issue Type Search**
```bash
API: POST /rest/api/3/search
JQL: project = "XDEMO2" AND issuetype = "Epic" ORDER BY created DESC
Result: ✅ Works (3/14 Epic found)
Reason: Standard Jira field names work correctly
```

### **Broken Scenarios:**

#### ❌ **Epic Name Search**
```bash  
API: POST /rest/api/3/search
Generated JQL: project = "XDEMO2" AND issuetype = "Epic" AND "Epic Name" ~ "Epic test MCP Jira tool"
Result: ❌ total=0 (no results)
Problem: "Epic Name" is not a valid field name in JQL
```

#### ❌ **Epic Key Search (for Stories)**
```bash
API: POST /rest/api/3/search  
Generated JQL: project = "XDEMO2" AND issuetype = "Story" AND "Epic Link" = "XDEMO2-260"
Result: ❌ total=0 (no results)
Problem: "Epic Link" is not a valid field name in JQL
```

---

## 🔧 Solution Required

### **Code Fix Location:**
**File:** `src/tools/jira/enhanced-search-issues.ts`  
**Lines:** 113-119

### **Current (Broken) Code:**
```typescript
if (params.epicName) {
  jqlParts.push(`"Epic Name" ~ "${params.epicName}"`);
}

if (params.epicKey) {
  jqlParts.push(`"Epic Link" = "${params.epicKey}"`);
}
```

### **Required Fix:**
```typescript
if (params.epicName) {
  jqlParts.push(`customfield_10014 ~ "${params.epicName}"`);  // Epic Name field
}

if (params.epicKey) {
  jqlParts.push(`customfield_10011 = "${params.epicKey}"`);   // Epic Link field
}
```

---

## 📊 Custom Field ID Reference

**Trong XDEMO2 project, các custom field IDs:**

| Field Name | Custom Field ID | Usage | JQL Syntax |
|------------|-----------------|--------|------------|
| Epic Name | `customfield_10014` | Epic's display name | `customfield_10014 ~ "search term"` |
| Epic Link | `customfield_10011` | Story→Epic relationship | `customfield_10011 = "EPIC-123"` |
| Story Points | `customfield_10016` | Story effort estimation | `customfield_10016 = 5` |
| Sprint | `customfield_10020` | Sprint assignment | `customfield_10020 in (123, 456)` |

---

## 🧪 Verification Steps

### **After Fix - Expected Results:**

#### **Test 1: Epic Name Search**
```bash
Param: projectKey="XDEMO2", epicName="Epic test MCP Jira tool"
Expected JQL: project = "XDEMO2" AND issuetype = "Epic" AND customfield_10014 ~ "Epic test MCP Jira tool"
Expected Result: ✅ Should return XDEMO2-260
```

#### **Test 2: Epic Key Search**  
```bash
Param: projectKey="XDEMO2", epicKey="XDEMO2-260"
Expected JQL: project = "XDEMO2" AND issuetype = "Story" AND customfield_10011 = "XDEMO2-260"
Expected Result: ✅ Should return Stories linked to this Epic
```

---

## ⚠️ Additional Considerations

### **Cross-Instance Compatibility:**
- Custom field IDs may differ across Jira instances
- Consider implementing field ID detection mechanism
- Alternative: Support both field names and IDs with fallback logic

### **Performance Impact:**
- Fix has no performance impact
- Same API endpoint, just corrected JQL syntax
- May actually improve performance as searches will return valid results

### **Backward Compatibility:**
- This is a bug fix, not a breaking change
- No impact on existing working functionality
- Only affects previously broken Epic search scenarios

---

**Priority:** 🔥 **HIGH** - Core Epic search functionality is broken
**Estimated Fix Time:** 15 minutes
**Testing Time:** 15 minutes  
**Total Impact:** Low risk, high value fix

*Analysis completed: August 10, 2025*