# Lịch sử phát triển MCP Atlassian Server

Tài liệu này ghi lại lịch sử phát triển của MCP Atlassian Server, bao gồm các giai đoạn đã hoàn thành và các vấn đề đã được giải quyết trong quá trình triển khai.

## Các giai đoạn đã hoàn thành

### Phase 1: Thiết lập cơ bản
- [x] Tạo cấu trúc thư mục cho MCP Atlassian Server
- [x] Thiết lập package.json và các dependencies cần thiết
- [x] Cấu hình TypeScript
- [x] Thiết lập tệp .env và cấu hình biến môi trường
- [x] Tạo các utils cơ bản cho việc giao tiếp với Atlassian API

### Phase 2: Xây dựng API Utils
- [x] Tạo hàm helper để gọi Jira API
- [x] Tạo hàm helper để gọi Confluence API
- [x] Xây dựng bộ chuyển đổi ADF (Atlassian Document Format) sang Markdown
- [x] Cài đặt error handling và logging
- [x] Viết unit test cho các utils

### Phase 3: Triển khai Jira Agent
- [x] Triển khai tool getIssue để lấy thông tin chi tiết về một issue
- [x] Triển khai tool searchIssues để tìm kiếm issues theo JQL
- [x] Triển khai tool createIssue để tạo issue mới
- [x] Triển khai tool updateIssue để cập nhật issue
- [x] Triển khai tool transitionIssue để chuyển trạng thái issue
- [x] Triển khai tool assignIssue để gán issue cho người dùng
- [x] Viết unit test cho từng tool

### Phase 4: Triển khai Confluence Agent
- [x] Triển khai tool getPage để lấy thông tin chi tiết về một trang
- [x] Triển khai tool searchPages để tìm kiếm trang theo CQL
- [x] Triển khai tool createPage để tạo trang mới
- [x] Triển khai tool updatePage để cập nhật trang
- [x] Triển khai tool getSpaces để lấy danh sách spaces
- [x] Triển khai tool addComment để thêm comment vào trang
- [x] Viết unit test cho từng tool

### Phase 5: Tích hợp MCP Protocol
- [x] Khởi tạo MCP Server framework
- [x] Đổi API đăng ký từ registerTool sang tool (theo MCP SDK mới)
- [x] Thiết lập context quản lý cho các tools
- [x] Sửa lỗi kiểu dữ liệu trả về cho các tools để tuân thủ MCP Protocol
  - [x] Áp dụng kiểu McpResponse với createTextResponse/createErrorResponse
  - [x] Đảm bảo tất cả các tools trả về theo định dạng chuẩn
  - [x] Thêm xử lý lỗi đầy đủ với try-catch và định dạng lỗi chuẩn
- [x] Xây dựng transport layer (StdioServerTransport)
- [x] Thiết lập cấu trúc file test e2e

### Phase 6: Tạo và Kiểm thử MCP Client
- [x] Tạo cấu trúc dự án client (dev_mcp-atlassian-test-client)
- [x] Cấu hình TypeScript và dependencies
- [x] Tạo mô-đun đọc và quản lý biến môi trường
- [x] Triển khai kết nối StdioClientTransport
- [x] Thực hiện các lệnh gọi API cơ bản
- [x] Sửa lỗi xử lý context trong MCP Server
  - [x] Cập nhật các công cụ Jira để sử dụng (context as any).atlassianConfig
  - [x] Cập nhật các công cụ Confluence để sử dụng (context as any).atlassianConfig

### Phase 7: Chuẩn hóa phương pháp gọi API
- [x] Chuyển đổi phương pháp gọi API Jira từ SDK jira.js sang sử dụng fetch trực tiếp
  - [x] Cập nhật hàm getIssue để sử dụng fetch thay vì SDK
  - [x] Cập nhật hàm searchIssues để sử dụng fetch thay vì SDK
  - [x] Cập nhật các hàm Jira còn lại để sử dụng fetch
- [x] Đảm bảo tất cả các API calls (cả Jira và Confluence) sử dụng cùng phương pháp
  - [x] Áp dụng header User-Agent nhất quán
  - [x] Sử dụng cấu trúc error handling giống nhau
  - [x] Chuẩn hóa định dạng response
- [x] Kiểm thử các API calls
  - [x] Kiểm thử thành công với getIssue của Jira (Issue XDEMO2-1)
  - [x] Kiểm thử thành công với getSpaces của Confluence
- [x] Viết unit tests cho các phương thức API mới
- [x] Tái cấu trúc mã nguồn để mô-đun hóa các hàm gọi API

### Phase 8: Chuẩn hóa URL và thông điệp phản hồi
- [x] Sửa lỗi URL trong các công cụ Confluence để thêm "/wiki" vào đường dẫn
  - [x] Cập nhật getSpaces để sử dụng URL đúng
  - [x] Cập nhật searchPages để sử dụng URL đúng
  - [x] Cập nhật createPage để sử dụng URL đúng 
  - [x] Cập nhật updatePage để sử dụng URL đúng
  - [x] Cập nhật getPage để hiển thị URL đúng
- [x] Chuẩn hóa thông điệp phản hồi từ các công cụ
  - [x] Thêm trường message vào JSON response của tất cả các công cụ
  - [x] Đảm bảo thông báo nhất quán giữa các công cụ
  - [x] Kiểm thử thông báo phản hồi từ tất cả các công cụ

### Phase 9: Triển khai MCP Resources Capability
- [x] Thiết lập cơ sở hạ tầng cho MCP Resource Capability
- [x] Xây dựng hệ thống mẫu và template để triển khai resources
- [x] Phân loại API thành Resource (read-only) và Tool (có side effects)
- [x] Triển khai Resource handler cho Jira và Confluence
- [x] Đặc tả URI pattern cho Resources
- [x] Kiểm thử Resources với MCP Inspector và Cline
- [x] Chuẩn hóa định dạng phản hồi cho Resources

#### Jira Resources đã triển khai
- [x] `jira://projects` - Danh sách tất cả projects
- [x] `jira://projects/{projectKey}` - Chi tiết project cụ thể
- [x] `jira://issues/{issueKey}` - Chi tiết issue cụ thể
- [x] `jira://issues` - Danh sách tất cả issues (hỗ trợ phân trang)
- [x] `jira://issues?jql={query}` - Tìm kiếm issues bằng JQL
- [x] `jira://issues/{issueKey}/transitions` - Các trạng thái có thể chuyển đổi của issue
- [x] `jira://issues/{issueKey}/comments` - Comments trên issue
- [x] `jira://users` - Danh sách users
- [x] `jira://users/{accountId}` - Chi tiết user cụ thể

#### Confluence Resources đã triển khai
- [x] `confluence://spaces` - Danh sách tất cả spaces
- [x] `confluence://spaces/{spaceKey}` - Chi tiết space cụ thể
- [x] `confluence://spaces/{spaceKey}/pages` - Danh sách trang trong space
- [x] `confluence://pages` - Danh sách tất cả pages
- [x] `confluence://pages?cql={query}` - Tìm kiếm pages bằng CQL
- [x] `confluence://pages/{pageId}` - Chi tiết page cụ thể
- [x] `confluence://pages/{pageId}/children` - Các trang con
- [x] `confluence://pages/{pageId}/comments` - Comments trên page

#### Tools đã chuyển đổi thành Resources
- [x] `searchIssues` → `jira://issues?jql={query}`
- [x] `getPage` → `confluence://pages/{pageId}`
- [x] `getSpaces` → `confluence://spaces`
- [x] `searchPages` → `confluence://pages?cql={query}`

#### Tools giữ nguyên do có side effects
- [x] `createIssue` - Gây tác dụng phụ (tạo mới issue)
- [x] `updateIssue` - Gây tác dụng phụ (thay đổi dữ liệu issue)
- [x] `transitionIssue` - Gây tác dụng phụ (thay đổi trạng thái issue)
- [x] `addComment` (Jira) - Gây tác dụng phụ (thêm comment)
- [x] `createPage` - Gây tác dụng phụ (tạo mới page)
- [x] `updatePage` - Gây tác dụng phụ (thay đổi dữ liệu page)
- [x] `addComment` (Confluence) - Gây tác dụng phụ (thêm comment)

### Phase 14: Dockerization và Deployment
- [x] Tạo Dockerfile
- [x] Thiết lập Docker Compose cho môi trường phát triển
- [x] Tạo script quản lý Docker (start-docker.sh)
- [x] Đơn giản hóa quá trình triển khai
  - [x] Chỉ sử dụng STDIO transport cho độ tin cậy cao nhất
  - [x] Tạo một container duy nhất cho mỗi instance
  - [x] Cung cấp hướng dẫn rõ ràng cho kết nối với Cline
- [x] Chuẩn bị tài liệu hướng dẫn triển khai
  - [x] Cập nhật README.md với hướng dẫn cài đặt và sử dụng
  - [x] Cập nhật tài liệu xử lý sự cố phổ biến

### Phase 15: Dọn dẹp và Tối ưu hóa Source Code
- [x] Loại bỏ code và file không cần thiết
  - [x] Xóa thư mục `coverage` (báo cáo test tạm thời)
  - [x] Xóa file `.DS_Store` (file metadata của macOS)
  - [x] Xóa file test không sử dụng (`src/tests/setup.ts.disabled`)
  - [x] Xóa thư mục `src/services` không được sử dụng
- [x] Tạo và cấu hình file `.gitignore`
  - [x] Loại trừ các thư mục không cần đưa vào version control (`node_modules`, `dist`, `coverage`)
  - [x] Loại trừ file môi trường nhạy cảm (`.env`)
  - [x] Loại trừ file hệ thống (`.DS_Store`)
  - [x] Loại trừ file tạm thời và logs
- [x] Kiểm tra và xác minh sau khi dọn dẹp
  - [x] Build source code thành công
  - [x] Start MCP server không gặp lỗi
  - [x] Các tính năng vẫn hoạt động bình thường với Cline
- [x] Cập nhật tài liệu
  - [x] Cập nhật README.md với cấu trúc tốt hơn
  - [x] Thêm thông tin dọn dẹp source code vào implementation_plan.md

## Vấn đề đã phát hiện và giải quyết

### 1. Lỗi context.get trong các tool handlers
- **Mô tả**: Khi gọi các tools từ MCP client, xuất hiện lỗi "context.get is not a function"
- **Nguyên nhân đã xác định**: 
  - Phương thức xử lý context trong các tool handlers không phù hợp với cách MCP SDK kết nối
  - Trong các tool handlers, `context` được truyền vào không phải là một `Map` hoặc đối tượng với phương thức `get`
  - Trong phiên bản mới của MCP SDK, đối tượng context có thể có cấu trúc khác

- **Giải pháp đã thực hiện**:
  - Đã thay đổi cách truy cập context trong tất cả các tool handlers:
    ```typescript
    // Thay vì
    const config = context.get('atlassianConfig') as AtlassianConfig;
    
    // Đã sử dụng
    const config = (context as any).atlassianConfig as AtlassianConfig;
    ```
  - Đã cập nhật lại cách đăng ký context khi khởi tạo MCP Server để phù hợp với SDK mới
  - Đã kiểm tra và xác nhận hoạt động ổn định với cách tiếp cận mới

### 2. Vấn đề kết nối Atlassian API qua MCP Server
- **Mô tả**: Khi gọi Atlassian API thông qua MCP Server, luôn nhận được lỗi 403 từ Cloudfront, mặc dù gọi trực tiếp từ terminal với cùng credential hoạt động bình thường
- **Những kiểm tra đã thực hiện**:
  - Đã kiểm tra và xác nhận API token đúng và hoạt động khi gọi trực tiếp từ command line
  - Đã xác minh domain Atlassian (phuc-nt.atlassian.net) chính xác
  - Đã xác nhận project XDEMO2 và issue XDEMO2-1 tồn tại và có thể truy cập từ tài khoản phucnt0@gmail.com
  - Đã xác nhận thông tin Space TX trong Confluence tồn tại và có thể truy cập
  - Đã kiểm tra biến môi trường trong file .env được tải đúng (ATLASSIAN_SITE_NAME, ATLASSIAN_USER_EMAIL, ATLASSIAN_API_TOKEN)
- **Nguyên nhân đã xác định**:
  - Lỗi "403 ERROR" từ Cloudfront là do thiếu header User-Agent trong request
  - Atlassian API kiểm tra User-Agent để chặn các request không hợp lệ
- **Giải pháp đã thực hiện**:
  - Đã thêm header User-Agent: MCP-Atlassian-Server/1.0.0 vào tất cả các requests
  - Đã chuyển đổi từ SDK jira.js sang sử dụng fetch trực tiếp cho API Jira
  - Đã áp dụng cùng một cơ chế request cho cả Jira và Confluence API
  - Đã kiểm thử thành công tất cả các API calls

### 3. Vấn đề URL không đúng trong các công cụ Confluence
- **Mô tả**: URL được trả về từ Confluence API bị thiếu phần "/wiki" trong đường dẫn
- **Nguyên nhân đã xác định**:
  - Confluence API trả về đường dẫn trong response theo định dạng không đầy đủ (thiếu "/wiki")
  - Khi ghép chuỗi URL, đường dẫn bị xây dựng sai thành "phuc-nt.atlassian.net/spaces" thay vì "phuc-nt.atlassian.net/wiki/spaces"
- **Giải pháp đã thực hiện**:
  - Đã sửa đổi tất cả các công cụ Confluence để thêm "/wiki" vào đường dẫn URL
  - Đã cập nhật getSpaces để sửa URL trả về
  - Đã cập nhật createPage để sử dụng định dạng URL đúng 
  - Đã cập nhật searchPages để sửa đường dẫn
  - Đã cập nhật updatePage và getPage để hiển thị URL chính xác
  - Đã kiểm thử các URL mới và xác nhận tất cả đều hoạt động đúng

### 4. Vấn đề thông báo phản hồi thiếu trong JSON
- **Mô tả**: Một số công cụ trả về "No message" trong kết quả thay vì thông báo có ý nghĩa
- **Nguyên nhân đã xác định**:
  - Trường message được tạo ra trong handler nhưng không được truyền vào JSON response
  - JSON response chỉ chứa các trường cơ bản mà không bao gồm thông báo
- **Giải pháp đã thực hiện**:
  - Đã thêm trường message vào JSON response của tất cả các công cụ
  - Đã đảm bảo thông báo phản hồi nhất quán và có ý nghĩa
  - Đã kiểm tra và xác nhận tất cả các thông báo phản hồi hiển thị đúng

### 5. Vấn đề với SSE Transport
- **Mô tả**: SSE Transport gặp nhiều vấn đề khi triển khai trong Docker, dẫn đến các lỗi kết nối và không tìm thấy công cụ.
- **Nguyên nhân đã xác định**:
  - SSE Transport có cấu hình phức tạp và yêu cầu HTTP server
  - Port binding dễ xung đột với các dịch vụ khác
  - Cấu hình URL trong Cline dễ gây nhầm lẫn

- **Giải pháp đã thực hiện**:
  - Đã chuyển đổi hoàn toàn sang STDIO transport
  - Đã loại bỏ HTTP server để tránh xung đột port
  - Đã đơn giản hóa cấu hình Docker Compose chỉ với một container
  - Đã cải thiện script quản lý Docker để dễ sử dụng hơn
  - Đã cập nhật tài liệu với hướng dẫn kết nối rõ ràng

## Bài học kinh nghiệm từ các phase đã hoàn thành

### API Integration
1. **Xử lý ADF**: Atlassian Document Format là phức tạp, cần chú ý khi chuyển đổi giữa ADF và Markdown
2. **Rate Limiting**: API của Atlassian có rate limiting nghiêm ngặt, cần triển khai cơ chế throttling và retry
3. **Validation**: Cần validate kỹ dữ liệu đầu vào trước khi gửi request đến Atlassian API
4. **Headers**: Đảm bảo tất cả các headers cần thiết đều được đưa vào requests, đặc biệt là User-Agent
5. **URL Construction**: Cẩn thận khi tạo URL đảm bảo đúng định dạng và mã hóa

### Error Handling
1. **Error Categorization**: Phân loại lỗi rõ ràng theo loại (API, Authentication, Validation, Server, Client)
2. **Error Response**: Đảm bảo phản hồi lỗi có đầy đủ thông tin (mã lỗi HTTP, mô tả, hướng dẫn khắc phục)
3. **Retry Mechanism**: Triển khai cơ chế thử lại cho các lỗi tạm thời

### Response Formatting
1. **Consistency**: Đảm bảo nhất quán trong định dạng phản hồi
2. **Content vs Data**: Tách biệt rõ ràng giữa nội dung hiển thị và dữ liệu
3. **URLs**: Đảm bảo tất cả các URL đều đầy đủ và chính xác

### Context Management
1. **Context Access**: Truy cập context theo cách phù hợp với SDK
2. **Context Initialization**: Đảm bảo context được khởi tạo đúng

### Testing
1. **End-to-End Testing**: Kiểm thử toàn bộ quy trình
2. **Environment Variables**: Sử dụng biến môi trường cho cấu hình

### MCP Capabilities
1. **Resources Management**: Xác định tài nguyên rõ ràng với ID và schema cụ thể
2. **Prompt Engineering**: Thiết kế cấu trúc prompt rõ ràng
3. **Sampling Optimization**: Điều chỉnh sampling parameters phù hợp với từng loại dữ liệu 