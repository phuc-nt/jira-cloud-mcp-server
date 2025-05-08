# Hướng Dẫn Implementation: Bổ Sung Resources và Tools cho MCP Atlassian Server (Chuẩn hóa atlassian-api.ts)

Dưới đây là hướng dẫn chi tiết để bổ sung resource/tool mới cho MCP Atlassian Server, **chỉ sử dụng các hàm từ `atlassian-api.ts`** (KHÔNG sử dụng `jiraClient`, `confluenceClient` hay `atlassian-client.js`).

---

## I. Bổ Sung Resources

### 1. Jira: Filters
```typescript
import { getFilters, getFilterById, getMyFilters } from '../../utils/atlassian-api.js';

// Danh sách filter
const response = await getFilters(config, offset, limit);
// Chi tiết filter
const filter = await getFilterById(config, filterId);
// Filter cá nhân
const myFilters = await getMyFilters(config);
```

### 2. Jira: Boards
```typescript
import { getBoards, getBoardById, getBoardIssues } from '../../utils/atlassian-api.js';

// Danh sách boards
const response = await getBoards(config, offset, limit);
// Chi tiết board
const board = await getBoardById(config, boardId);
// Issues trong board
const issues = await getBoardIssues(config, boardId, offset, limit);
```

### 3. Jira: Sprints
```typescript
import { getSprintsByBoard, getSprintById, getSprintIssues } from '../../utils/atlassian-api.js';

// Danh sách sprints trong board
const response = await getSprintsByBoard(config, boardId, offset, limit);
// Chi tiết sprint
const sprint = await getSprintById(config, sprintId);
// Issues trong sprint
const issues = await getSprintIssues(config, sprintId, offset, limit);
```

### 4. Confluence: Labels, Attachments, Content Versions
```typescript
import { getPageLabels, getPageAttachments, getPageVersions } from '../../utils/atlassian-api.js';

// Labels của page
const response = await getPageLabels(config, pageId, offset, limit);
// Attachments của page
const response = await getPageAttachments(config, pageId, offset, limit);
// Versions của page
const response = await getPageVersions(config, pageId, offset, limit);
```

---

## II. Bổ Sung Tools

### 1. Filter Tools
```typescript
import { createFilter, updateFilter, deleteFilter } from '../../utils/atlassian-api.js';

// Tạo filter
const response = await createFilter(config, name, jql, description, favourite);
// Cập nhật filter
const response = await updateFilter(config, filterId, { name, jql, description, favourite });
// Xóa filter
await deleteFilter(config, filterId);
```

### 2. Sprint Tools
```typescript
import { createSprint } from '../../utils/atlassian-api.js';

// Tạo sprint
const response = await createSprint(config, boardId, name, startDate, endDate, goal);
```

### 3. Confluence Label Tools
```typescript
import { addLabelsToPage, removeLabelsFromPage } from '../../utils/atlassian-api.js';

// Thêm label vào page
await addLabelsToPage(config, pageId, labels);
// Xóa label khỏi page
await removeLabelsFromPage(config, pageId, labels);
```

---

## III. Lưu ý Quan Trọng

1. **Chỉ sử dụng các hàm từ `atlassian-api.ts`** để thao tác với Jira/Confluence. KHÔNG sử dụng `jiraClient`, `confluenceClient`, hoặc bất kỳ client wrapper JS nào khác.
2. **API Endpoints**: Jira Agile API sử dụng `/rest/agile/1.0/`, Jira core sử dụng `/rest/api/3/`, Confluence sử dụng `/wiki/rest/api/` (các hàm trong `atlassian-api.ts` đã chuẩn hóa sẵn).
3. **Xử lý ADF**: Sử dụng hàm `adfToMarkdown` trong `atlassian-api.ts` nếu cần chuyển đổi nội dung rich text.
4. **Phân trang**: Các hàm resource đều hỗ trợ `offset`, `limit`.
5. **Schema**: Đảm bảo resource/tool trả về đúng schema đã định nghĩa.
6. **Error Handling**: Sử dụng try/catch và trả về lỗi rõ ràng.

---

## IV. Ví dụ tổng quát

```typescript
// Lấy danh sách filter
const filters = await getFilters(config, 0, 20);

// Tạo filter mới
const newFilter = await createFilter(config, 'My Filter', 'project = TEST', 'Test filter', true);

// Thêm label vào page Confluence
await addLabelsToPage(config, '123456', ['important', 'urgent']);
```

---

**Tóm lại:**
- Luôn import và sử dụng các hàm từ `atlassian-api.ts`.
- Không còn bất kỳ import hoặc hướng dẫn nào liên quan đến `atlassian-client.js`, `jiraClient`, `confluenceClient`.
- Nếu cần mở rộng resource/tool mới, hãy viết hàm mới trong `atlassian-api.ts` rồi sử dụng lại ở resource/tool.

Với hướng dẫn này, bạn có thể triển khai đầy đủ các resource và tool mới cho MCP Atlassian Server, giúp người dùng tương tác hiệu quả hơn với Jira và Confluence thông qua AI.