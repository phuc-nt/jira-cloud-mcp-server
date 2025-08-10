# Sprint 6.2: Agile & Dashboard Modules  
**Phase 6 - Days 2-3: Specialized Module Implementation**

## 🎯 Sprint Goals
- Implement Agile module với 10 sprint/workflow tools
- Implement Dashboard module với 8 analytics tools  
- Establish parallel build system cho multiple modules

## 📋 Tasks Breakdown

### Day 2: Agile Module (Est: 4 hours)

#### Task 1: Agile Module Setup (Est: 60min)
- [ ] Tạo `src/modules/agile/` folder structure
- [ ] Implement `src/modules/agile/index.ts` entry point
- [ ] Setup agile-specific interfaces và utilities
- [ ] Configure build target: `dist/agile.js`

#### Task 2: Sprint Management Tools (Est: 90min)
- [ ] Move sprint tools to `src/modules/agile/tools/`:
  - `createSprint` - Create new sprints
  - `startSprint` - Start sprint with board configuration  
  - `closeSprint` - Close sprint với issue movement
- [ ] Implement agile workflow validation logic
- [ ] Add sprint state management utilities

#### Task 3: Board & Backlog Tools (Est: 90min)
- [ ] Implement board management tools:
  - `getBoardConfiguration` - Get board settings
  - `getBoardSprints` - List board sprints
- [ ] Implement backlog tools:
  - `addIssueToSprint` - Move issues to sprint
  - `addIssuesToBacklog` - Add issues to backlog  
  - `rankBacklogIssues` - Reorder backlog items

### Day 3: Dashboard Module (Est: 4 hours)

#### Task 4: Dashboard Module Setup (Est: 60min)
- [ ] Tạo `src/modules/dashboard/` folder structure
- [ ] Implement `src/modules/dashboard/index.ts` entry point
- [ ] Setup dashboard-specific types và interfaces
- [ ] Configure build target: `dist/dashboard.js`

#### Task 5: Dashboard CRUD Operations (Est: 120min)
- [ ] Move dashboard tools to `src/modules/dashboard/tools/`:
  - `createDashboard` - Create new dashboards
  - `updateDashboard` - Update dashboard properties
  - `listDashboards` - List user dashboards
  - `getDashboard` - Get dashboard details
  - `getDashboardGadgets` - Get dashboard gadgets

#### Task 6: Gadget Management (Est: 60min) 
- [ ] Implement gadget tools:
  - `addGadgetToDashboard` - Add gadgets to dashboards
  - `removeGadgetFromDashboard` - Remove gadgets
  - `getJiraGadgets` - List available gadgets

### Task 7: Integration Testing (Est: 60min)
- [ ] Test Agile module standalone operation
- [ ] Test Dashboard module standalone operation  
- [ ] Verify module isolation và independent startup
- [ ] Memory usage comparison với monolithic server

## ✅ Success Criteria
- Agile module (10 tools) builds to `dist/agile.js` successfully
- Dashboard module (8 tools) builds to `dist/dashboard.js` successfully  
- Both modules work independently without dependencies
- Memory reduction: ~79% (Agile), ~83% (Dashboard) vs full server

## 🔄 Dependencies & Blockers  
- **Requires**: Sprint 6.1 core infrastructure complete
- **Blocks**: Sprint 6.3 Search module implementation

## 📊 Module Tool Distribution

### Agile Module Tools (10 total)
#### Sprint Management (3 tools)
1. `createSprint` - Create new sprints với board association
2. `startSprint` - Start sprint với commitment và goal setting
3. `closeSprint` - Close sprint với issue resolution handling

#### Board Operations (2 tools)
4. `getBoardConfiguration` - Get board columns, workflows, filters
5. `getBoardSprints` - List all sprints for specific board

#### Backlog Management (5 tools)  
6. `addIssueToSprint` - Move individual issues to active sprint
7. `addIssuesToBacklog` - Bulk add issues to product backlog
8. `rankBacklogIssues` - Reorder issues in backlog for prioritization
9. `addIssueToSprint` - (operational tool for sprint planning)
10. Agile workflow utilities

### Dashboard Module Tools (8 total)
#### Dashboard CRUD (5 tools)
1. `createDashboard` - Create new dashboards với layout configuration
2. `updateDashboard` - Update dashboard name, description, sharing
3. `listDashboards` - List dashboards visible to user
4. `getDashboard` - Get dashboard details với gadget information
5. `getDashboardGadgets` - Get all gadgets for specific dashboard

#### Gadget Management (3 tools)
6. `addGadgetToDashboard` - Add gadgets với position và configuration  
7. `removeGadgetFromDashboard` - Remove gadgets from dashboard
8. `getJiraGadgets` - List all available gadget types và templates

## 🎯 Architecture Benefits

### Agile Module Benefits
- **Workflow Focus**: Specialized cho sprint management
- **Team Oriented**: Perfect cho agile teams
- **Memory Efficient**: 79% reduction vs full server
- **Isolated Scope**: No analytics or read-only overhead

### Dashboard Module Benefits  
- **Analytics Complete**: Toàn bộ dashboard ecosystem
- **Reporting Focus**: Specialized cho analytics use cases
- **Ultra Lightweight**: 83% memory reduction
- **Self Contained**: Complete dashboard management trong 1 module