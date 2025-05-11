# MCP Atlassian Server: Resources & Tools Reference

Tài liệu này liệt kê đầy đủ các Resource (truy vấn dữ liệu) và Tool (thao tác) mà MCP Atlassian Server hỗ trợ, kèm endpoint Atlassian API thực tế và thông tin kỹ thuật chi tiết dành cho developers.

## Hướng dẫn dành cho Developers

Tài liệu này cung cấp thông tin chi tiết về implementation, API endpoints, cấu trúc dữ liệu, và các lưu ý kỹ thuật quan trọng để:

- Hiểu cách Resource và Tool được triển khai
- Thêm mới hoặc mở rộng Resource/Tool
- Xử lý các trường hợp đặc biệt (ADF, version conflicts, error handling)
- Debugging và maintenance

## JIRA

### 1. Issue

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Issues | `jira://issues` | Danh sách issue | `/rest/api/3/search` | Array của Issue objects |
| Issue Details | `jira://issues/{issueKey}` | Chi tiết issue | `/rest/api/3/issue/{issueKey}` | Single Issue object |
| Issue Transitions | `jira://issues/{issueKey}/transitions` | Các transition khả dụng của issue | `/rest/api/3/issue/{issueKey}/transitions` | Array của Transition objects |
| Issue Comments | `jira://issues/{issueKey}/comments` | Danh sách comment của issue | `/rest/api/3/issue/{issueKey}/comment` | Array của Comment objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createIssue | Tạo issue mới | projectKey, summary, ... | `/rest/api/3/issue` | Issue key và ID mới |
| updateIssue | Cập nhật issue | issueKey, summary, ... | `/rest/api/3/issue/{issueIdOrKey}` | Status của update |
| transitionIssue | Chuyển trạng thái issue | issueKey, transitionId | `/rest/api/3/issue/{issueIdOrKey}/transitions` | Status của transition |
| assignIssue | Gán issue cho user | issueKey, accountId | `/rest/api/3/issue/{issueIdOrKey}/assignee` | Status của assignment |
| addIssuesToBacklog | Đưa issue vào backlog | boardId, issueKeys | `/rest/agile/1.0/board/{boardId}/issue` | Status của thêm |
| addIssueToSprint | Đưa issue vào sprint | sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue` | Status của thêm |
| rankBacklogIssues | Sắp xếp thứ tự issue trong backlog | boardId, issueKeys, rankBeforeIssue, rankAfterIssue | `/rest/agile/1.0/board/{boardId}/issue/{issueKey}/rank` | Status của sắp xếp |

### 2. Project

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về | 
|----------|-----|-------|-----------------------|----------------|
| Projects | `jira://projects` | Danh sách project | `/rest/api/3/project` | Array của Project objects |
| Project Details | `jira://projects/{projectKey}` | Chi tiết project | `/rest/api/3/project/{projectKey}` | Single Project object |
| Project Roles | `jira://projects/{projectKey}/roles` | Danh sách role của project | `/rest/api/3/project/{projectKey}/role` | Array các role (name, id) |

### 3. Board

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Boards | `jira://boards` | Danh sách board | `/rest/agile/1.0/board` | Array của Board objects |
| Board Details | `jira://boards/{boardId}` | Chi tiết board | `/rest/agile/1.0/board/{boardId}` | Single Board object |
| Board Issues | `jira://boards/{boardId}/issues` | Danh sách issue trên board | `/rest/agile/1.0/board/{boardId}/issue` | Array của Issue objects |
| Board Configuration | `jira://boards/{boardId}/configuration` | Cấu hình board | `/rest/agile/1.0/board/{boardId}/configuration` | Board config object |
| Board Sprints | `jira://boards/{boardId}/sprints` | Danh sách sprint trên board | `/rest/agile/1.0/board/{boardId}/sprint` | Array của Sprint objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createSprint | Tạo sprint mới trên board | boardId, name, ... | `/rest/agile/1.0/sprint` | Sprint ID mới |
| rankBacklogIssues | Sắp xếp issue trên board | boardId, issueKeys, ... | `/rest/agile/1.0/board/{boardId}/issue/{issueKey}/rank` | Status của sắp xếp |

### 4. Sprint

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Sprint Details | `jira://sprints/{sprintId}` | Chi tiết sprint | `/rest/agile/1.0/sprint/{sprintId}` | Single Sprint object |
| Sprint Issues | `jira://sprints/{sprintId}/issues` | Danh sách issue trong sprint | `/rest/agile/1.0/sprint/{sprintId}/issue` | Array của Issue objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createSprint | Tạo sprint mới | boardId, name, ... | `/rest/agile/1.0/sprint` | Sprint ID mới |
| startSprint | Bắt đầu sprint | sprintId, ... | `/rest/agile/1.0/sprint/{sprintId}/start` | Status của bắt đầu |
| closeSprint | Đóng sprint | sprintId, ... | `/rest/agile/1.0/sprint/{sprintId}/close` | Status của đóng |
| addIssueToSprint | Thêm issue vào sprint | sprintId, issueKeys | `/rest/agile/1.0/sprint/{sprintId}/issue` | Status của thêm |

### 5. Filter

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Filters | `jira://filters` | Danh sách filter | `/rest/api/3/filter/search` | Array của Filter objects |
| Filter Details | `jira://filters/{filterId}` | Chi tiết filter | `/rest/api/3/filter/{filterId}` | Single Filter object |
| My Filters | `jira://filters/my` | Filter của tôi | `/rest/api/3/filter/my` | Array của Filter objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createFilter | Tạo filter mới | name, jql, ... | `/rest/api/3/filter` | Filter ID mới |
| updateFilter | Cập nhật filter | filterId, ... | `/rest/api/3/filter/{filterId}` | Status của update |
| deleteFilter | Xóa filter | filterId | `/rest/api/3/filter/{filterId}` | Status của xoá |

### 6. Dashboard & Gadget

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Dashboards | `jira://dashboards` | Danh sách dashboard | `/rest/api/3/dashboard` | Array của Dashboard objects |
| My Dashboards | `jira://dashboards/my` | Dashboard của tôi | `/rest/api/3/dashboard?filter=my` | Array của Dashboard objects |
| Dashboard Details | `jira://dashboards/{dashboardId}` | Chi tiết dashboard | `/rest/api/3/dashboard/{dashboardId}` | Single Dashboard object |
| Dashboard Gadgets | `jira://dashboards/{dashboardId}/gadgets` | Danh sách gadget trên dashboard | `/rest/api/3/dashboard/{dashboardId}/gadget` | Array của Gadget objects |
| Gadgets | `jira://gadgets` | Danh sách gadget | `/rest/api/3/dashboard/gadgets` | Array của Gadget objects |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createDashboard | Tạo dashboard mới | name, ... | `/rest/api/3/dashboard` | Dashboard ID mới |
| updateDashboard | Cập nhật dashboard | dashboardId, ... | `/rest/api/3/dashboard/{dashboardId}` | Status của update |
| addGadgetToDashboard | Thêm gadget vào dashboard | dashboardId, uri, ... | `/rest/api/3/dashboard/{dashboardId}/gadget` | Gadget ID mới |
| removeGadgetFromDashboard | Xóa gadget khỏi dashboard | dashboardId, gadgetId | `/rest/api/3/dashboard/{dashboardId}/gadget/{gadgetId}` | Status của xóa |

### 7. User

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| User Details | `jira://users/{accountId}` | Thông tin user | `/rest/api/3/user?accountId=...` | Single User object |
| Assignable Users | `jira://users/assignable/{projectKey}` | User có thể gán cho project | `/rest/api/3/user/assignable/search?project=...` | Array của User objects |
| Users by Role | `jira://users/role/{projectKey}/{roleId}` | User theo role trong project | `/rest/api/3/project/{projectKey}/role/{roleId}` | Array của User objects |

---

## CONFLUENCE

### 1. Space

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Spaces | `confluence://spaces` | Danh sách space | `/wiki/api/v2/spaces` | Array của Space objects (v2) |
| Space Details | `confluence://spaces/{spaceKey}` | Chi tiết space | `/wiki/api/v2/spaces/{spaceKey}` | Single Space object (v2) |
| Space Pages | `confluence://spaces/{spaceKey}/pages` | Danh sách page trong space | `/wiki/api/v2/pages?space-id=...` | Array của Page objects (v2) |

### 2. Page

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Page Details | `confluence://pages/{pageId}` | Chi tiết page (v2) | `/wiki/api/v2/pages/{pageId}` + `/wiki/api/v2/pages/{pageId}/body` | Single Page object (v2) |
| Page Children | `confluence://pages/{pageId}/children` | Danh sách page con | `/wiki/api/v2/pages/{pageId}/children` | Array của Page objects (v2) |
| Page Ancestors | `confluence://pages/{pageId}/ancestors` | Danh sách ancestor của page | `/wiki/api/v2/pages/{pageId}/ancestors` | Array của Page objects (v2) |
| Page Attachments | `confluence://pages/{pageId}/attachments` | Danh sách file đính kèm | `/wiki/api/v2/pages/{pageId}/attachments` | Array của Attachment objects (v2) |
| Page Versions | `confluence://pages/{pageId}/versions` | Lịch sử version của page | `/wiki/api/v2/pages/{pageId}/versions` | Array của Version objects (v2) |
| Pages | `confluence://pages` | Tìm kiếm page theo filter | `/wiki/api/v2/pages` | Array của Page objects (v2) |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createPage | Tạo page mới | spaceId, title, content, parentId | `/wiki/api/v2/pages` | Page ID mới |
| updatePage | Cập nhật nội dung page | pageId, title, content, version | `/wiki/api/v2/pages/{pageId}` (PUT) | Status của update |
| updatePageTitle | Đổi tiêu đề page | pageId, title, version | `/wiki/api/v2/pages/{pageId}/title` (PUT) | Status của update |
| deletePage | Xóa page | pageId, draft, purge | `/wiki/api/v2/pages/{pageId}` (DELETE) | Status của xóa |

### 3. Comment

#### Resource
| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Page Comments | `confluence://pages/{pageId}/comments` | Danh sách comment của page | `/wiki/api/v2/pages/{pageId}/footer-comments`, `/wiki/api/v2/pages/{pageId}/inline-comments` | Array của Comment objects (v2) |

#### Tool
| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| addComment | Thêm comment vào page | pageId, content | `/wiki/api/v2/footer-comments` | Comment mới |
| updateFooterComment | Cập nhật comment ở footer | commentId, version, value, ... | `/wiki/api/v2/footer-comments/{commentId}` (PUT) | Status của update |
| deleteFooterComment | Xóa comment ở footer | commentId | `/wiki/api/v2/footer-comments/{commentId}` (DELETE) | Status của xóa |

---

## Implementation Details: Hướng dẫn mở rộng Resource & Tool cho Developer

Khi muốn thêm mới **Resource** (truy vấn dữ liệu) hoặc **Tool** (thao tác/mutation) cho Jira hoặc Confluence, hãy làm theo các bước sau:

### 1. Xác định loại bạn muốn thêm
- **Resource**: Trả về dữ liệu, chỉ đọc (GET), ví dụ: danh sách issue, chi tiết project, các comment, v.v.
- **Tool**: Thực hiện hành động/thao tác (POST/PUT/DELETE), ví dụ: tạo issue, cập nhật filter, thêm comment, v.v.

### 2. Chọn đúng thư mục và file
- **Resource**
  - Thêm file mới hoặc cập nhật file trong:
    - `src/resources/jira/` (cho Jira)
    - `src/resources/confluence/` (cho Confluence)
  - Đăng ký resource mới trong file `index.ts` tương ứng (nếu cần).
- **Tool**
  - Thêm file mới hoặc cập nhật file trong:
    - `src/tools/jira/` (cho Jira)
    - `src/tools/confluence/` (cho Confluence)
  - Đăng ký tool mới trong `src/tools/index.ts`.

### 3. Sử dụng các helper API đúng chuẩn
- Không tự gọi trực tiếp fetch() hoặc axios trong resource/tool.
- Luôn sử dụng các hàm helper đã có trong:
  - `src/utils/jira-resource-api.ts`, `src/utils/confluence-resource-api.ts` (cho resource)
  - `src/utils/jira-tool-api-v3.ts`, `src/utils/jira-tool-api-agile.ts`, `src/utils/confluence-tool-api.ts` (cho tool)
- Nếu cần gọi API mới, hãy bổ sung helper function vào các file trên.

### 4. Định nghĩa schema dữ liệu
- Mỗi resource/tool mới **bắt buộc phải có schema** validate input/output.
- Thêm hoặc cập nhật schema trong:
  - `src/schemas/jira.ts` (cho Jira)
  - `src/schemas/confluence.ts` (cho Confluence)
- Đảm bảo schema phản ánh đúng dữ liệu thực tế trả về/tạo ra từ Atlassian API.

### 5. Đăng ký resource/tool vào MCP server
- **Resource**: Đăng ký qua hàm `registerResource` hoặc `server.resource` trong file resource tương ứng.
- **Tool**: Đăng ký qua hàm `server.tool` trong file tool, sau đó gọi đăng ký trong `registerAllTools` ở `src/tools/index.ts`.

### 6. Cập nhật tài liệu
- Sau khi thêm resource/tool mới, cập nhật lại tài liệu:
  - Bảng liệt kê resource/tool trong `docs/introduction/resources-and-tools.md`
  - Schema mô tả input/output nếu có thay đổi

### 7. Lưu ý quan trọng
- Luôn kiểm tra và test thực tế với Cline hoặc client MCP để đảm bảo hoạt động đúng.
- Log và xử lý lỗi nhất quán: Sử dụng logger và error handler chung.
- Đặt tên hàm, biến, schema rõ ràng, nhất quán theo tiếng Anh.
- Không thay đổi signature các hàm cũ nếu không thực sự cần thiết (giữ backward compatibility).
- Tách biệt rõ resource (read-only) và tool (mutation), không gộp chung logic.

**Tóm tắt trình tự khi thêm mới:**
1. Xác định loại (resource/tool) và vị trí file.
2. Thêm/cập nhật file resource/tool.
3. Bổ sung helper API nếu cần.
4. Định nghĩa/cập nhật schema.
5. Đăng ký vào MCP server.
6. Cập nhật tài liệu.
7. Test thực tế và kiểm tra log/error.

Nếu tuân thủ đúng các bước trên, việc mở rộng MCP Atlassian Server sẽ luôn nhất quán, dễ bảo trì và dễ mở rộng về sau!

## Best Practices

1. **Start Simple**: Bắt đầu với truy vấn và tham số cơ bản.
2. **Check Permissions**: Đảm bảo tài khoản Atlassian có quyền truy cập phù hợp.
3. **Handle Errors**: Luôn kiểm tra và xử lý lỗi trả về từ API.
4. **Chain Resources and Tools**: Lấy dữ liệu từ resource trước khi thao tác với tool.
5. **Use Clear Examples**: Khi hướng dẫn AI assistant, luôn đưa ví dụ rõ ràng.

## Notes & Versioning

- Từ 6/2025, toàn bộ resource Jira đã migrate sang API v3 (`/rest/api/3/...`). Các trường rich text (description/comment) trả về dạng ADF, đã tự động convert sang text nếu client không hỗ trợ ADF.
- Tất cả resource và tool Confluence hiện tại chỉ sử dụng API v2 (`/wiki/api/v2/` và `/rest/agile/1.0`). Các endpoint v1 đã bị loại bỏ hoàn toàn.