# Trạng thái triển khai Resources và Tools

## Resources

### Jira Resources

| Resource | URI Pattern | Trạng thái | Chức năng |
|----------|-------------|------------|-----------|
| Projects (danh sách) | `jira://projects` | ✅ Đã triển khai | Lấy danh sách tất cả projects |
| Project chi tiết | `jira://projects/{projectKey}` | ✅ Đã triển khai | Lấy thông tin chi tiết về một project |
| Issue chi tiết | `jira://issues/{issueKey}` | ✅ Đã triển khai | Lấy thông tin chi tiết về một issue |
| Issues (danh sách) | `jira://issues` | ✅ Đã triển khai | Lấy danh sách issues với phân trang |
| Tìm kiếm Issues | `jira://issues?jql={query}` | ✅ Đã triển khai | Tìm kiếm issues theo JQL |
| Issue Transitions | `jira://issues/{issueKey}/transitions` | ✅ Đã triển khai | Lấy danh sách các transitions có thể |
| Issue Comments | `jira://issues/{issueKey}/comments` | ✅ Đã triển khai | Lấy danh sách comments của issue |
| Users | `jira://users` | ✅ Đã triển khai* | Lấy danh sách người dùng Jira |
| User chi tiết | `jira://users/{accountId}` | ✅ Đã triển khai* | Lấy thông tin chi tiết về một người dùng |

\* **Lưu ý về API Jira Cloud**:
- `jira://users`: API Jira Cloud yêu cầu phải truyền query parameter (username/property) để tìm kiếm, không hỗ trợ lấy toàn bộ users
- `jira://users/{accountId}`: Chỉ chấp nhận accountId thực tế của Jira Cloud (ví dụ: "557058:8c1557f3-81f6-4479-a006-dd5e914a7c11"), không hỗ trợ email, username thông thường

### Confluence Resources

| Resource | URI Pattern | Trạng thái | Chức năng |
|----------|-------------|------------|-----------|
| Spaces (danh sách) | `confluence://spaces` | 📝 Kế hoạch | Lấy danh sách tất cả spaces |
| Space chi tiết | `confluence://spaces/{spaceKey}` | 📝 Kế hoạch | Lấy thông tin chi tiết về một space |
| Pages (danh sách) | `confluence://spaces/{spaceKey}/pages` | 📝 Kế hoạch | Lấy danh sách trang trong một space |
| Tìm kiếm Pages | `confluence://pages?cql={query}` | 📝 Kế hoạch | Tìm kiếm pages theo CQL |
| Page chi tiết | `confluence://pages/{pageId}` | 📝 Kế hoạch | Lấy thông tin chi tiết về một page |
| Page Children | `confluence://pages/{pageId}/children` | 📝 Kế hoạch | Lấy danh sách trang con |
| Page Comments | `confluence://pages/{pageId}/comments` | 📝 Kế hoạch | Lấy danh sách comments của page |

## Tools

### Jira Tools

| Tool | Trạng thái | Chức năng | Ghi chú |
|------|------------|-----------|---------|
| `createIssue` | 🔄 Đã có | Tạo issue mới | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `updateIssue` | 🔄 Đã có | Cập nhật issue | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `addComment` | 🔄 Đã có | Thêm comment vào issue | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `transitionIssue` | 🔄 Đã có | Chuyển trạng thái issue | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `searchIssues` | ✅ Đã chuyển đổi | Tìm kiếm issues theo JQL | Đã chuyển thành resource `jira://issues?jql={query}` |

### Confluence Tools

| Tool | Trạng thái | Chức năng | Ghi chú |
|------|------------|-----------|---------|
| `createPage` | 🔄 Đã có | Tạo trang mới | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `updatePage` | 🔄 Đã có | Cập nhật trang | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `addComment` | 🔄 Đã có | Thêm comment vào trang | Giữ nguyên dạng tool (gây tác dụng phụ) |
| `getPage` | ⚠️ Cần chuyển đổi | Lấy thông tin chi tiết trang | Chuyển thành resource `confluence://pages/{pageId}` |
| `getSpaces` | ⚠️ Cần chuyển đổi | Lấy danh sách spaces | Chuyển thành resource `confluence://spaces` |
| `searchPages` | ⚠️ Cần chuyển đổi | Tìm kiếm trang theo CQL | Chuyển thành resource `confluence://pages?cql={query}` |

## Kế hoạch triển khai

### Đã hoàn thành
- ✅ Đăng ký MCP Resources Capability
- ✅ Triển khai cơ chế đăng ký resource (registerResource)
- ✅ Cải thiện xử lý context để đảm bảo `atlassianConfig` luôn có sẵn
- ✅ Triển khai resources cho Jira Projects (danh sách và chi tiết)
- ✅ Triển khai resources cho Jira Issues (danh sách, chi tiết, tìm kiếm JQL)
- ✅ Triển khai resources cho Issue Transitions và Comments
- ✅ Triển khai resources cho Jira Users (với các hạn chế của API Jira Cloud)
- ✅ Chuyển đổi tool `searchIssues` thành resource `jira://issues?jql={query}`

### Đang thực hiện
- 🔄 Chuẩn bị triển khai resources cho Confluence

### Sắp triển khai
1. Resources cho Confluence:
   - Spaces và Pages
   - Tìm kiếm và truy vấn chi tiết
   - Comments của Pages

2. Chuyển đổi Tools thành Resources:
   - Tool `getPage` -> Resource `confluence://pages/{pageId}`
   - Tool `getSpaces` -> Resource `confluence://spaces`
   - Tool `searchPages` -> Resource `confluence://pages?cql={query}`

3. Cải thiện và tối ưu:
   - Mở rộng thêm Jira resources (Filters, Dashboards, Boards)
   - Hỗ trợ thêm tham số truy vấn cho các resources
   - Cải thiện định dạng dữ liệu trả về cho AI 