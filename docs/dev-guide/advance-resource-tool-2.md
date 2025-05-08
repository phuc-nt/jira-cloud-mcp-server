# Hướng Dẫn Implementation: Bổ Sung Resources và Tools Còn Lại (Chuẩn hóa atlassian-api.ts)

Dưới đây là hướng dẫn chi tiết để bổ sung resource/tool mới cho MCP Atlassian Server, **chỉ sử dụng các hàm từ `atlassian-api.ts`** (KHÔNG sử dụng `jiraClient`, `confluenceClient` hay `atlassian-client.js`).

---

## I. Bổ Sung Resources

### 1. Jira: Dashboards
```typescript
import {
  getDashboards,
  getMyDashboards,
  getDashboardById,
  getDashboardGadgets
} from '../../utils/atlassian-api.js';

// Danh sách tất cả dashboards
const dashboards = await getDashboards(config, offset, limit);
// Dashboard cá nhân (của user hiện tại)
const myDashboards = await getMyDashboards(config, offset, limit);
// Chi tiết dashboard
const dashboard = await getDashboardById(config, dashboardId);
// Gadgets (widgets) trong dashboard
const gadgets = await getDashboardGadgets(config, dashboardId);
```

---

## II. Bổ Sung Tools

### 1. Board Actions
```typescript
import {
  addIssueToBoard,
  configureBoardColumns
} from '../../utils/atlassian-api.js';

// Thêm issue vào board
await addIssueToBoard(config, boardId, issueKey);
// Cấu hình board
await configureBoardColumns(config, boardId, columns);
```

### 2. Sprint Actions (Nâng cao)
```typescript
import {
  startSprint,
  closeSprint,
  moveIssuesBetweenSprints
} from '../../utils/atlassian-api.js';

// Bắt đầu sprint
await startSprint(config, sprintId, startDate, endDate, goal);
// Đóng sprint (có thể tạo sprint mới nếu cần)
await closeSprint(config, sprintId, { completeDate, moveToSprintId, createNewSprint });
// Di chuyển issue giữa các sprint
await moveIssuesBetweenSprints(config, fromSprintId, toSprintId, issueKeys);
```

### 3. Backlog Actions
```typescript
import {
  addIssuesToBacklog,
  removeIssuesFromBacklog,
  rankBacklogIssues
} from '../../utils/atlassian-api.js';

// Thêm issue vào backlog
await addIssuesToBacklog(config, boardId, issueKeys);
// Xóa issue khỏi backlog (move to sprint)
await removeIssuesFromBacklog(config, boardId, sprintId, issueKeys);
// Sắp xếp backlog
await rankBacklogIssues(config, boardId, issueKeys, { rankBeforeIssue, rankAfterIssue });
```

### 4. Dashboard/Gadget Actions
```typescript
import {
  createDashboard,
  updateDashboard,
  addGadgetToDashboard,
  removeGadgetFromDashboard
} from '../../utils/atlassian-api.js';

// Tạo dashboard
const dashboard = await createDashboard(config, { name, description, sharePermissions });
// Cập nhật dashboard
await updateDashboard(config, dashboardId, { name, description, sharePermissions });
// Thêm gadget vào dashboard
const gadget = await addGadgetToDashboard(config, dashboardId, { gadgetUri, title, position, color, properties });
// Xóa gadget khỏi dashboard
await removeGadgetFromDashboard(config, dashboardId, gadgetId);
```

---

## III. Lưu ý khi mở rộng

1. **Tất cả resource/tool mới đều phải implement hàm chuẩn hóa trong `atlassian-api.ts`** (ví dụ: `getDashboards`, `addIssueToBoard`, `startSprint`, ...).
2. **Không sử dụng `jiraClient`, `confluenceClient`, hoặc bất kỳ client wrapper JS nào khác.**
3. **Các hàm mới nên nhận `config` và các tham số cần thiết, trả về dữ liệu thô từ API Atlassian.**
4. **Nếu API Atlassian chưa hỗ trợ trực tiếp, cần wrap logic phù hợp trong hàm chuẩn hóa.**
5. **Đảm bảo các hàm mới có xử lý lỗi, phân trang, và trả về dữ liệu đúng schema.**
6. **Ghi chú: Các hàm ví dụ trên cần tự implement trong `atlassian-api.ts` nếu chưa có.**

---

## IV. Ví dụ tổng quát

```typescript
// Lấy danh sách dashboard
const dashboards = await getDashboards(config, 0, 20);
// Thêm issue vào board
await addIssueToBoard(config, '123', 'TEST-1');
// Bắt đầu sprint
await startSprint(config, '456', '2024-06-01', '2024-06-15', 'Sprint goal');
```

---

**Tóm lại:**
- Luôn import và sử dụng các hàm từ `atlassian-api.ts`.
- Nếu resource/tool mới chưa có hàm, hãy implement hàm mới trong `atlassian-api.ts` rồi sử dụng lại ở resource/tool.
- Không còn bất kỳ import hoặc hướng dẫn nào liên quan đến `atlassian-client.js`, `jiraClient`, `confluenceClient`.

Bạn chỉ cần copy các ví dụ trên, implement hàm tương ứng trong `atlassian-api.ts` là có thể mở rộng resource/tool mới một cách đồng bộ, type-safe, dễ maintain.

---

## V. Tham khảo endpoint, param, schema Atlassian API

### Jira Dashboards
- **List dashboards:**
  - Endpoint: `GET /rest/api/3/dashboard?maxResults={limit}&startAt={startAt}`
  - Response: `{ dashboards: [...], total, maxResults, startAt }`
- **My dashboards:**
  - Endpoint: `GET /rest/api/3/dashboard/search?filter=my`
- **Dashboard details:**
  - Endpoint: `GET /rest/api/3/dashboard/{dashboardId}`
- **Dashboard gadgets:**
  - Endpoint: `GET /rest/api/3/dashboard/{dashboardId}` (field: `gadgets`)

### Board Actions
- **Add issue to board (scrum):**
  - Endpoint: `POST /rest/agile/1.0/backlog/issue`
  - Payload: `{ issues: [issueKey] }`
- **Get board config:**
  - Endpoint: `GET /rest/agile/1.0/board/{boardId}/configuration`
- **Update board columns:**
  - Endpoint: `PUT /rest/agile/1.0/board/{boardId}/configuration`
  - Payload: `{ ...boardConfig, columnConfig: { columns: [...] } }`

### Sprint Actions
- **Start sprint:**
  - Endpoint: `POST /rest/agile/1.0/sprint/{sprintId}`
  - Payload: `{ state: 'active', startDate, endDate, goal }`
- **Close sprint:**
  - Endpoint: `POST /rest/agile/1.0/sprint/{sprintId}`
  - Payload: `{ state: 'closed', completeDate, moveToSprintId? }`
- **Move issues between sprints:**
  - Endpoint: `POST /rest/agile/1.0/sprint/{sprintId}/issue`
  - Payload: `{ issues: [issueKey], remove?: true }`

### Backlog Actions
- **Add issues to backlog:**
  - Endpoint: `POST /rest/agile/1.0/backlog/issue`
  - Payload: `{ issues: [issueKey] }`
- **Remove issues from backlog (move to sprint):**
  - Endpoint: `POST /rest/agile/1.0/sprint/{sprintId}/issue`
  - Payload: `{ issues: [issueKey] }`
- **Rank backlog issues:**
  - Endpoint: `PUT /rest/agile/1.0/issue/rank`
  - Payload: `{ issues: [issueKey], rankBeforeIssue?, rankAfterIssue? }`

### Dashboard/Gadget Actions
- **Create dashboard:**
  - Endpoint: `POST /rest/api/3/dashboard`
  - Payload: `{ name, description, sharePermissions }`
- **Update dashboard:**
  - Endpoint: `PUT /rest/api/3/dashboard/{dashboardId}`
  - Payload: `{ name?, description?, sharePermissions? }`
- **Add gadget to dashboard:**
  - Endpoint: `POST /rest/api/3/dashboard/{dashboardId}/gadget`
  - Payload: `{ uri, color, position, title, properties? }`
- **Remove gadget from dashboard:**
  - Endpoint: `DELETE /rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}`

### Schema mẫu (tham khảo response Atlassian)
- Dashboard, Gadget, BoardConfig, Sprint, Backlog, ...
- Xem chi tiết tại: https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/