# Trạng thái Triển khai MCP Resources & Tools

Tài liệu này theo dõi trạng thái triển khai tất cả MCP Resources & Tools cho Atlassian Server.

## MCP Resources

### Jira Resources

| Resource | URI | Trạng thái | Chức năng |
|----------|-----|------------|-----------|
| Danh sách Projects | `jira://projects` | ✅ Đã triển khai | Trả về danh sách tất cả projects |
| Chi tiết Project | `jira://projects/{projectKey}` | ✅ Đã triển khai | Trả về thông tin chi tiết về project cụ thể |
| Chi tiết Issue | `jira://issues/{issueKey}` | ✅ Đã triển khai | Trả về thông tin chi tiết về issue cụ thể |
| Danh sách Issues | `jira://issues` | ✅ Đã triển khai | Trả về danh sách tất cả issues (có phân trang) |
| Tìm kiếm Issues bằng JQL | `jira://issues?jql={query}` | ✅ Đã triển khai | Tìm kiếm issues dựa trên JQL query (⚠️ Chuyển từ Tool `searchIssues`) |
| Transitions của Issue | `jira://issues/{issueKey}/transitions` | ✅ Đã triển khai | Trả về danh sách transitions có thể của issue cụ thể |
| Comments của Issue | `jira://issues/{issueKey}/comments` | ✅ Đã triển khai | Trả về danh sách comments trên issue cụ thể |
| Danh sách Users | `jira://users` | ✅ Đã triển khai | Trả về danh sách users trong Jira |
| Chi tiết User | `jira://users/{accountId}` | ✅ Đã triển khai | Trả về thông tin chi tiết về user cụ thể |

### Confluence Resources

| Resource | URI | Trạng thái | Chức năng |
|----------|-----|------------|-----------|
| Danh sách Spaces | `confluence://spaces` | ✅ Đã triển khai | Trả về danh sách tất cả spaces (⚠️ Chuyển từ Tool `getSpaces`) |
| Chi tiết Space | `confluence://spaces/{spaceKey}` | ✅ Đã triển khai | Trả về thông tin chi tiết về space cụ thể |
| Pages trong Space | `confluence://spaces/{spaceKey}/pages` | ✅ Đã triển khai | Trả về danh sách pages trong space cụ thể |
| Danh sách Pages | `confluence://pages` | ✅ Đã triển khai | Trả về danh sách tất cả pages |
| Tìm kiếm Pages bằng CQL | `confluence://pages?cql={query}` | ✅ Đã triển khai | Tìm kiếm pages dựa trên CQL query (⚠️ Chuyển từ Tool `searchPages`) |
| Chi tiết Page | `confluence://pages/{pageId}` | ✅ Đã triển khai | Trả về thông tin chi tiết về page cụ thể (⚠️ Chuyển từ Tool `getPage`) |
| Children của Page | `confluence://pages/{pageId}/children` | ✅ Đã triển khai | Trả về danh sách children của page cụ thể |
| Comments của Page | `confluence://pages/{pageId}/comments` | ✅ Đã triển khai | Trả về danh sách comments trên page cụ thể |

## MCP Tools

### Jira Tools

| Tool | Trạng thái | Chức năng |
|------|------------|-----------|
| `createIssue` | ✅ Đã triển khai | Tạo mới issue trong Jira |
| `updateIssue` | ✅ Đã triển khai | Cập nhật thông tin issue |
| `transitionIssue` | ✅ Đã triển khai | Chuyển đổi trạng thái issue |
| `addComment` (Jira) | ✅ Đã triển khai | Thêm comment vào issue |
| `searchIssues` | ⚠️ Chuyển sang Resource | Đã chuyển thành resource `jira://issues?jql={query}` |

### Confluence Tools

| Tool | Trạng thái | Chức năng |
|------|------------|-----------|
| `createPage` | ✅ Đã triển khai | Tạo mới page trong Confluence |
| `updatePage` | ✅ Đã triển khai | Cập nhật nội dung page |
| `addComment` (Confluence) | ✅ Đã triển khai | Thêm comment vào page |
| `getPage` | ⚠️ Chuyển sang Resource | Đã chuyển thành resource `confluence://pages/{pageId}` |
| `getSpaces` | ⚠️ Chuyển sang Resource | Đã chuyển thành resource `confluence://spaces` |
| `searchPages` | ⚠️ Chuyển sang Resource | Đã chuyển thành resource `confluence://pages?cql={query}` |

---

## Chú thích

- ✅ Đã triển khai: Đã triển khai và sẵn sàng sử dụng
- 🔄 Đang triển khai: Đang trong quá trình triển khai
- 📝 Kế hoạch: Đã lên kế hoạch triển khai
- ⚠️ Chuyển sang Resource: Tool đã được chuyển đổi thành Resource

## Kế hoạch triển khai

### Đã hoàn thành
- ✅ Đăng ký MCP Resources Capability
- ✅ Triển khai cơ chế đăng ký resource (registerResource)
- ✅ Cải thiện xử lý context để đảm bảo `atlassianConfig` luôn có sẵn
- ✅ Triển khai resources cho Jira Projects (danh sách và chi tiết)
- ✅ Triển khai resources cho Jira Issues (danh sách, chi tiết, tìm kiếm JQL)
- ✅ Triển khai resources cho Issue Transitions và Comments
- ✅ Triển khai resources cho Jira Users (với các hạn chế của API Jira Cloud)
- ✅ Triển khai resources cho Confluence Spaces (danh sách và chi tiết)
- ✅ Triển khai resources cho Confluence Pages (danh sách, chi tiết, tìm kiếm CQL)
- ✅ Triển khai resources cho Page Children và Comments
- ✅ Chuyển đổi tool `searchIssues` thành resource `jira://issues?jql={query}`
- ✅ Chuyển đổi tool `getPage` thành resource `confluence://pages/{pageId}`
- ✅ Chuyển đổi tool `getSpaces` thành resource `confluence://spaces`
- ✅ Chuyển đổi tool `searchPages` thành resource `confluence://pages?cql={query}`

### Đang thực hiện
- 🔄 Tối ưu hóa và mở rộng MCP Resources

### Sắp triển khai
1. Cải thiện và tối ưu:
   - Mở rộng thêm Jira resources (Filters, Dashboards, Boards)
   - Hỗ trợ thêm tham số truy vấn cho các resources
   - Cải thiện định dạng dữ liệu trả về cho AI 