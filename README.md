# MCP Server cho Atlassian (Jira và Confluence)

MCP (Model Context Protocol) Server cho Atlassian giúp kết nối các trợ lý AI với Jira và Confluence, cho phép truy vấn và thực hiện các tác vụ trên Atlassian Cloud.

## Tổng quan

MCP Server tạo cầu nối giữa các trợ lý AI và hệ thống Atlassian, cho phép AI tương tác với Jira và Confluence mà không cần được huấn luyện trước về các API cụ thể.

Ứng dụng này triển khai Model Context Protocol (MCP), một chuẩn mở giúp các mô hình AI gọi công cụ và tương tác với dịch vụ bên ngoài.

## Yêu cầu hệ thống

- Node.js 16+ (cho phát triển local)
- Docker và Docker Compose (cho triển khai container)
- Tài khoản Atlassian Cloud và API token

## Cài đặt và Khởi chạy

### Phát triển Local

1. Clone repository:
   ```bash
   git clone https://github.com/yourusername/mcp-atlassian-server.git
   cd mcp-atlassian-server
   ```

2. Cài đặt dependencies:
   ```bash
   npm install
   ```

3. Tạo file `.env` với nội dung:
   ```
   ATLASSIAN_SITE_NAME=your-site.atlassian.net
   ATLASSIAN_USER_EMAIL=your-email@example.com
   ATLASSIAN_API_TOKEN=your-api-token
   ```

4. Build và chạy:
   ```bash
   npm run build
   npm start
   ```

### Sử dụng Docker

1. Tạo file `.env` như trên

2. Chạy script để quản lý Docker:
   ```bash
   chmod +x start-docker.sh
   ./start-docker.sh
   ```

3. Chọn "1. Chạy MCP Server (với STDIO Transport)"

## Kết nối với Cline

Có hai cách để kết nối MCP Server với Cline:

### Phương pháp 1: Kết nối qua Docker (khuyến nghị)

Thêm cấu hình sau vào file `cline_mcp_settings.json`:

```json
{
  "mcpServers": {
    "atlassian-docker-stdio": {
      "disabled": false,
      "timeout": 60,
      "command": "docker",
      "args": ["exec", "-i", "mcp-atlassian", "node", "dist/index.js"],
      "env": {},
      "transportType": "stdio"
    }
  }
}
```

Với cách này, thông tin xác thực Atlassian sẽ được đọc từ file `.env` trong container, không cần thiết lập lại trong cấu hình Cline.

### Phương pháp 2: Kết nối trực tiếp với Node.js local

Nếu bạn không muốn sử dụng Docker, bạn có thể kết nối trực tiếp với Node.js local:

```json
{
  "mcpServers": {
    "atlassian-local-stdio": {
      "disabled": false,
      "timeout": 60,
      "command": "node",
      "args": ["/đường/dẫn/tới/mcp-atlassian-server/dist/index.js"],
      "env": {
        "ATLASSIAN_SITE_NAME": "your-site.atlassian.net",
        "ATLASSIAN_USER_EMAIL": "your-email@example.com",
        "ATLASSIAN_API_TOKEN": "your-api-token"
      },
      "transportType": "stdio"
    }
  }
}
```

**Lưu ý**: Khi sử dụng phương pháp này, bạn cần thay thế `/đường/dẫn/tới/` bằng đường dẫn thực tế đến thư mục dự án của bạn và cung cấp thông tin xác thực Atlassian trực tiếp trong cấu hình.

## Quản lý Docker

Script `start-docker.sh` cung cấp các tùy chọn sau:

1. Chạy MCP Server (với STDIO Transport)
2. Dừng và xóa container
3. Xem logs của container
4. Hiển thị cấu hình Cline
5. Thoát

## Chi tiết API

MCP Server cung cấp các API để tương tác với Jira và Confluence:

### Jira API

#### `getIssue`
Lấy thông tin chi tiết về một issue trong Jira.
- **Tham số**:
  - `issueIdOrKey*`: ID hoặc key của issue (ví dụ: PROJ-123)

#### `searchIssues`
Tìm kiếm issues trong Jira theo JQL (Jira Query Language).
- **Tham số**:
  - `jql*`: JQL query để tìm kiếm issues (ví dụ: project = PROJ AND status = "In Progress")
  - `maxResults`: Số lượng kết quả tối đa
  - `fields`: Các trường cần trả về

#### `createIssue`
Tạo issue mới trong Jira.
- **Tham số**:
  - `projectKey*`: Key của project (ví dụ: PROJ)
  - `summary*`: Tiêu đề của issue
  - `issueType`: Loại issue (ví dụ: Bug, Task, Story)
  - `description`: Mô tả của issue
  - `priority`: Mức độ ưu tiên (ví dụ: High, Medium, Low)
  - `assignee`: Username của người được gán
  - `labels`: Các nhãn gán cho issue

#### `updateIssue`
Cập nhật thông tin của một issue trong Jira.
- **Tham số**:
  - `issueIdOrKey*`: ID hoặc key của issue cần cập nhật (ví dụ: PROJ-123)
  - `summary`: Tiêu đề mới của issue
  - `description`: Mô tả mới của issue
  - `priority`: Mức độ ưu tiên mới (ví dụ: High, Medium, Low)
  - `labels`: Các nhãn mới gán cho issue
  - `customFields`: Các trường tùy chỉnh cần cập nhật

#### `transitionIssue`
Chuyển trạng thái của một issue trong Jira.
- **Tham số**:
  - `issueIdOrKey*`: ID hoặc key của issue (ví dụ: PROJ-123)
  - `transitionId*`: ID của transition cần áp dụng
  - `comment`: Comment khi thực hiện transition

#### `assignIssue`
Gán issue trong Jira cho một người dùng.
- **Tham số**:
  - `issueIdOrKey*`: ID hoặc key của issue (ví dụ: PROJ-123)
  - `accountId`: Account ID của người được gán (để trống để bỏ gán)

### Confluence API

#### `getPage`
Lấy thông tin chi tiết về một trang trong Confluence.
- **Tham số**:
  - `pageId*`: ID của trang Confluence
  - `expand`: Các thuộc tính bổ sung cần lấy

#### `searchPages`
Tìm kiếm trang trong Confluence theo CQL (Confluence Query Language).
- **Tham số**:
  - `cql*`: CQL query để tìm kiếm trang (ví dụ: space = "DEV" AND title ~ "API")
  - `limit`: Số lượng kết quả tối đa
  - `expand`: Các thuộc tính bổ sung cần lấy

#### `createPage`
Tạo trang mới trong Confluence.
- **Tham số**:
  - `spaceKey*`: Key của space để tạo trang (ví dụ: DEV, HR)
  - `title*`: Tiêu đề của trang
  - `content*`: Nội dung của trang (ở định dạng Confluence storage/HTML)
  - `parentId`: ID của trang cha (nếu muốn tạo trang con)

#### `updatePage`
Cập nhật nội dung và thông tin của một trang trong Confluence.
- **Tham số**:
  - `pageId*`: ID của trang cần cập nhật
  - `title`: Tiêu đề mới của trang
  - `content`: Nội dung mới của trang (ở định dạng storage/HTML)
  - `version*`: Số phiên bản hiện tại của trang (cần thiết để tránh xung đột)
  - `addLabels`: Các nhãn mới cần thêm vào trang
  - `removeLabels`: Các nhãn cần xóa khỏi trang

#### `getSpaces`
Lấy danh sách spaces trong Confluence.
- **Tham số**:
  - `limit`: Số lượng spaces tối đa để lấy
  - `type`: Loại space để lọc
  - `status`: Trạng thái của space
  - `expand`: Các thuộc tính bổ sung cần lấy

#### `addComment`
Thêm comment vào trang Confluence.
- **Tham số**:
  - `pageId*`: ID của trang cần thêm comment
  - `content*`: Nội dung của comment (ở định dạng Confluence storage/HTML)

## Xử lý sự cố

Nếu bạn gặp vấn đề khi kết nối với Cline, hãy kiểm tra:

1. Container Docker đang chạy:
   ```bash
   docker ps --filter "name=mcp-atlassian"
   ```

2. Logs của container:
   ```bash
   docker logs mcp-atlassian
   ```

3. Cấu hình Atlassian API token có đúng không:
   - Đảm bảo tài khoản Atlassian có quyền truy cập vào các API cần thiết
   - Kiểm tra token còn hiệu lực

4. Kiểm tra kết nối với API Atlassian:
   ```bash
   curl -u "your-email@example.com:your-api-token" -H "Content-Type: application/json" https://your-site.atlassian.net/rest/api/3/project
   ``` 