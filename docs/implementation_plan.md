# Kế hoạch triển khai Atlassian Agent (Jira và Confluence)

## Tổng quan
Kế hoạch triển khai Atlassian Agent (bao gồm Jira Agent và Confluence Agent) theo mô hình MCP (Model Context Protocol), tập trung vào việc xây dựng một server MCP để kết nối giữa trợ lý AI và các hệ thống Atlassian. Ban đầu, sẽ ưu tiên tích hợp với Jira và Confluence, hai công cụ phổ biến nhất trong hệ sinh thái Atlassian.

## Danh sách tác vụ và tiến độ

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

### Phase 5: Tích hợp MCP Protocol (Hoàn thành)
- [x] Khởi tạo MCP Server framework
- [x] Đổi API đăng ký từ registerTool sang tool (theo MCP SDK mới)
- [x] Thiết lập context quản lý cho các tools
- [x] Sửa lỗi kiểu dữ liệu trả về cho các tools để tuân thủ MCP Protocol
  - [x] Áp dụng kiểu McpResponse với createTextResponse/createErrorResponse
  - [x] Đảm bảo tất cả các tools trả về theo định dạng chuẩn
  - [x] Thêm xử lý lỗi đầy đủ với try-catch và định dạng lỗi chuẩn
- [x] Xây dựng transport layer (StdioServerTransport)
- [x] Thiết lập cấu trúc file test e2e

### Phase 6: Tạo và Kiểm thử MCP Client (Hoàn thành)
- [x] Tạo cấu trúc dự án client (dev_mcp-atlassian-test-client)
- [x] Cấu hình TypeScript và dependencies
- [x] Tạo mô-đun đọc và quản lý biến môi trường
- [x] Triển khai kết nối StdioClientTransport
- [x] Thực hiện các lệnh gọi API cơ bản
- [x] Sửa lỗi xử lý context trong MCP Server
  - [x] Cập nhật các công cụ Jira để sử dụng (context as any).atlassianConfig
  - [x] Cập nhật các công cụ Confluence để sử dụng (context as any).atlassianConfig

### Phase 7: Chuẩn hóa phương pháp gọi API (Hoàn thành)
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

### Phase 8: Chuẩn hóa URL và thông điệp phản hồi (Hoàn thành)
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

### Mục tiêu
- Triển khai API Resources cho MCP Atlassian Server
- Chuyển đổi các tools hiện có thành resources khi phù hợp
- Tối ưu hóa cấu trúc dữ liệu trả về cho mục đích AI

### Checklist
1. **Cấu trúc mã cho Resources API**
   - [x] Tạo module `resources` cho tất cả các resources
   - [x] Thiết lập interfaces và types cho resources
   - [x] Tạo các helper functions cho việc định dạng dữ liệu trả về

2. **Triển khai Resource API cơ bản**
   - [x] Đăng ký MCP Resources Capability trên server
   - [x] Tạo cơ chế đăng ký resource (registerResource)
   - [x] Cải thiện xử lý context để đảm bảo `atlassianConfig` luôn có sẵn
   - [x] Thêm xử lý lỗi cho resources

3. **Triển khai Resources cho Jira Projects**
   - [x] Resource `jira://projects` để liệt kê tất cả projects
   - [x] Resource `jira://projects/:projectKey` để lấy chi tiết project
   - [x] Tối ưu cấu trúc dữ liệu trả về cho các project
   - [x] Thêm xử lý URI pattern để trích xuất tham số từ URI

4. **Triển khai Resources cho Jira Issues**
   - [x] Resource `jira://issues/:issueKey` để lấy chi tiết một issue
   - [ ] Resource `jira://issues` để liệt kê các issues với phân trang
   - [ ] Hỗ trợ JQL để tìm kiếm issues (`jira://issues?jql={query}`)
   - [ ] Thêm resources cho transitions và comments của issues

5. **Chuyển đổi Tools thành Resources**
   - [ ] Tool `searchIssues` -> Resource `jira://issues?jql={query}` 
   - [ ] Tool `getPage` -> Resource `confluence://pages/:pageId`
   - [ ] Tool `searchPages` -> Resource `confluence://pages?cql={query}`
   - [ ] Tool `getSpaces` -> Resource `confluence://spaces`

6. **Bổ sung Resources**
   - [ ] Jira Users: `jira://users` và `jira://users/:accountId`
   - [ ] Confluence Spaces: `confluence://spaces/:spaceKey`
   - [ ] Confluence Pages: `confluence://pages/:pageId/children`
   - [ ] Comments: `jira://issues/:issueKey/comments` và `confluence://pages/:pageId/comments`

### Kết luận về phân loại API
Sau khi phân tích các API, chúng ta đã phân loại chúng thành hai nhóm chính:

1. **Resources**: Các API chỉ đọc, không gây tác dụng phụ, dùng để truy xuất thông tin
   - Ví dụ: lấy danh sách projects, chi tiết issue, tìm kiếm theo JQL/CQL
   - URI pattern: `protocol://resource-type/identifier`
   - Phù hợp để triển khai qua giao thức resources

2. **Tools**: Các API thực hiện hành động, làm thay đổi trạng thái hệ thống
   - Ví dụ: tạo/cập nhật/xóa issues, thêm comments, chuyển trạng thái
   - Phù hợp để giữ nguyên dưới dạng tools

Ưu tiên triển khai các API chỉ đọc dưới dạng Resources trước vì:
- Đơn giản hơn để triển khai (không phức tạp về xác thực/ủy quyền)
- Cung cấp mô hình truy cập thông nhất và dễ mở rộng
- Phù hợp với mục đích chính của Claude là truy vấn thông tin

### Phase 10: Tối ưu và Mở rộng
- [ ] Thêm các authentication methods bổ sung (OAuth)
- [ ] Cập nhật documentation cho tất cả APIs
- [ ] Cải thiện hiệu suất
  - [ ] Tối ưu hóa API calls
  - [ ] Cài đặt caching để giảm số lượng requests
  - [ ] Cải thiện error handling và retry logic

### Phase 11: Triển khai MCP Capabilities khác
- [ ] Triển khai MCP Prompts Capability
  - [ ] Thiết kế cấu trúc prompt chuẩn cho Atlassian
  - [ ] Tạo hệ thống xử lý và routing prompt
  - [ ] Phát triển prompt history và suggestion system
- [ ] Triển khai MCP Sampling Capability
  - [ ] Cài đặt tham số sampling cơ bản (temperature, top_k, top_p)
  - [ ] Phát triển chiến lược sampling cho dữ liệu Atlassian
  - [ ] Tạo API để client điều chỉnh sampling parameters

### Phase 12: Tích hợp với DevAssist Central Agent
- [ ] Tạo interface giữa MCP Server và Central Agent
- [ ] Cập nhật mock agents trong Central Agent để sử dụng MCP Server
- [ ] Viết integration test giữa Central Agent và MCP Server
- [ ] Cập nhật cấu hình để Central Agent có thể sử dụng MCP Server
- [ ] Tích hợp MCP capabilities mới với Central Agent
  - [ ] Kết nối Resources API với Central Agent
  - [ ] Hỗ trợ Prompt processing trong Central Agent
  - [ ] Triển khai Sampling controls trong Central Agent

### Phase 13: Triển khai Security và Monitoring
- [ ] Triển khai rate limiting để tránh quá tải API
- [ ] Thiết lập monitoring cho API calls
- [ ] Cài đặt logging cho mọi requests và responses
- [ ] Thiết lập cơ chế bảo mật cho tokens và credentials

### Phase 14: Dockerization và Deployment (Hoàn thành)
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

### Phase 15: Dọn dẹp và Tối ưu hóa Source Code (Hoàn thành)
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

### Lỗi context.get trong các tool handlers (Đã giải quyết)
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

### Vấn đề kết nối Atlassian API qua MCP Server (Đã giải quyết)
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

### Vấn đề URL không đúng trong các công cụ Confluence (Đã giải quyết)
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

### Vấn đề thông báo phản hồi thiếu trong JSON (Đã giải quyết)
- **Mô tả**: Một số công cụ trả về "No message" trong kết quả thay vì thông báo có ý nghĩa
- **Nguyên nhân đã xác định**:
  - Trường message được tạo ra trong handler nhưng không được truyền vào JSON response
  - JSON response chỉ chứa các trường cơ bản mà không bao gồm thông báo
- **Giải pháp đã thực hiện**:
  - Đã thêm trường message vào JSON response của tất cả các công cụ
  - Đã đảm bảo thông báo phản hồi nhất quán và có ý nghĩa
  - Đã kiểm tra và xác nhận tất cả các thông báo phản hồi hiển thị đúng

### Vấn đề với SSE Transport (Đã giải quyết)
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

### Best Practices cho Docker Deployment

1. **Container Configuration**:
   - Sử dụng STDIO transport cho kết nối đáng tin cậy
   - Mount file .env để quản lý cấu hình dễ dàng
   - Sử dụng restart policy để tự động khởi động lại khi cần

2. **Resource Management**:
   - Sử dụng node:18-slim làm base image để tối ưu kích thước
   - Cài đặt dependencies trong bước build để tránh cài đặt lại
   - Chạy ứng dụng dưới quyền non-root (khuyến nghị cho triển khai production)

3. **Security**:
   - Sử dụng volumes để bảo vệ thông tin nhạy cảm
   - Không hardcode thông tin xác thực trong Docker Compose
   - Sử dụng Docker secrets cho môi trường production

## Những phát hiện trong quá trình dọn dẹp source
### Cải thiện quản lý source code
- **Mô tả**: Dự án thiếu file `.gitignore` để loại trừ các file không cần thiết khỏi version control
- **Phân tích**:
  - Thiếu cơ chế để loại trừ thư mục `node_modules`, `dist`, `coverage`
  - File nhạy cảm như `.env` có thể vô tình được commit
  - File hệ thống như `.DS_Store` đã xuất hiện trong repo
- **Hành động**:
  - Đã tạo file `.gitignore` với cấu hình đầy đủ
  - Đã xóa các file không cần thiết như `.DS_Store`

## Chi tiết triển khai các API chính

### Jira API
1. **getIssue**: Lấy thông tin chi tiết về một issue
   - Input: issueIdOrKey
   - Output: Chi tiết issue bao gồm trạng thái, người gán, mô tả, comments, v.v.

2. **searchIssues**: Tìm kiếm issues theo JQL
   - Input: jql, maxResults
   - Output: Danh sách các issues phù hợp với điều kiện tìm kiếm

3. **createIssue**: Tạo issue mới
   - Input: projectKey, summary, description, issueType, v.v.
   - Output: Thông tin về issue mới tạo

4. **updateIssue**: Cập nhật thông tin của issue
   - Input: issueIdOrKey, fields cần cập nhật
   - Output: Xác nhận cập nhật thành công

5. **transitionIssue**: Chuyển trạng thái của issue
   - Input: issueIdOrKey, transitionId
   - Output: Xác nhận chuyển trạng thái thành công

6. **assignIssue**: Gán issue cho người dùng
   - Input: issueIdOrKey, accountId
   - Output: Xác nhận gán người dùng thành công

### Confluence API
1. **getPage**: Lấy thông tin chi tiết về một trang
   - Input: pageId
   - Output: Chi tiết trang bao gồm nội dung, version, space, v.v.

2. **searchPages**: Tìm kiếm trang theo CQL
   - Input: cql, limit, expand
   - Output: Danh sách các trang phù hợp với điều kiện tìm kiếm

3. **createPage**: Tạo trang mới
   - Input: spaceKey, title, content, parentId
   - Output: Thông tin về trang mới tạo

4. **updatePage**: Cập nhật nội dung của trang
   - Input: pageId, title, content, version, addLabels, removeLabels
   - Output: Xác nhận cập nhật thành công

5. **getSpaces**: Lấy danh sách spaces
   - Input: limit, type, status, expand
   - Output: Danh sách các spaces

6. **addComment**: Thêm comment vào trang
   - Input: pageId, content
   - Output: ID của comment mới

## Bài học kinh nghiệm và Best Practices

### API Integration
1. **Xử lý ADF**: Atlassian Document Format là phức tạp, cần chú ý khi chuyển đổi giữa ADF và Markdown
2. **Rate Limiting**: API của Atlassian có rate limiting nghiêm ngặt, cần triển khai cơ chế throttling và retry
3. **Validation**: Cần validate kỹ dữ liệu đầu vào trước khi gửi request đến Atlassian API
   - Sử dụng Zod cho schema validation
   - Kiểm tra các trường bắt buộc
   - Xác thực giá trị của các tham số
4. **Headers**: Đảm bảo tất cả các headers cần thiết đều được đưa vào requests
   - User-Agent là bắt buộc để tránh bị chặn bởi Cloudfront
   - Content-Type phải chính xác (application/json)
   - Accept nên được thiết lập phù hợp (application/json)
5. **URL Construction**: Cẩn thận khi tạo URL đảm bảo đúng định dạng và mã hóa
   - Đảm bảo bao gồm đầy đủ các phần của URL (ví dụ: "/wiki" trong URL Confluence)
   - Sử dụng encodeURIComponent cho các tham số trong URL
   - Xác minh domain của Atlassian Cloud (example.atlassian.net)

### Error Handling
1. **Error Categorization**: Phân loại lỗi rõ ràng theo loại
   - Lỗi API (400, 401, 403, 404, 429, 500)
   - Lỗi xác thực (Authentication Error)
   - Lỗi ủy quyền (Authorization Error)
   - Lỗi validation (Validation Error)
   - Lỗi server (Server Error)
   - Lỗi client (Client Error)
2. **Error Response**: Đảm bảo phản hồi lỗi có đầy đủ thông tin
   - Bao gồm mã lỗi HTTP
   - Mô tả lỗi rõ ràng
   - Hướng dẫn khắc phục nếu có thể
   - Tham chiếu lỗi để dễ tìm trong logs
3. **Retry Mechanism**: Triển khai cơ chế thử lại cho các lỗi tạm thời
   - Thử lại với backoff nhẹ cho lỗi 429 (Rate Limit)
   - Thử lại với jitter để tránh thundering herd

### Response Formatting
1. **Consistency**: Đảm bảo nhất quán trong định dạng phản hồi
   - Luôn bao gồm trường `success` để chỉ ra kết quả
   - Luôn bao gồm trường `message` để mô tả kết quả
   - Sử dụng cùng cấu trúc cho tất cả các công cụ
2. **Content vs Data**: Tách biệt rõ ràng giữa nội dung hiển thị và dữ liệu
   - Content để hiển thị cho người dùng
   - Data để sử dụng trong code
3. **URLS**: Đảm bảo tất cả các URL đều đầy đủ và chính xác
   - Bao gồm protocol (https://)
   - Bao gồm đầy đủ đường dẫn (/wiki/spaces/...)
   - Mã hóa các ký tự đặc biệt trong URL

### Context Management
1. **Context Access**: Truy cập context theo cách phù hợp với SDK
   - Sử dụng `(context as any).propertyName` thay vì `context.get('propertyName')` nếu SDK đã thay đổi
   - Kiểm tra null/undefined trước khi truy cập properties
2. **Context Initialization**: Đảm bảo context được khởi tạo đúng
   - Thiết lập các giá trị mặc định
   - Đảm bảo tính khả dụng của tất cả giá trị cần thiết

### Testing
1. **End-to-End Testing**: Kiểm thử toàn bộ quy trình
   - Xác minh tất cả các công cụ đều hoạt động đúng
   - Kiểm tra tương tác giữa các công cụ
   - Xác minh URL, thông báo, và kết quả trả về
2. **Environment Variables**: Sử dụng biến môi trường cho cấu hình
   - Tách biệt cấu hình theo môi trường (dev, test, prod)
   - Không hardcode thông tin nhạy cảm
   - Sử dụng .env.example để hướng dẫn người dùng

### MCP Capabilities
1. **Resources Management**: 
   - Xác định tài nguyên rõ ràng với ID và schema cụ thể
   - Thiết kế API endpoints nhất quán cho tất cả tài nguyên
   - Triển khai kiểm soát truy cập chi tiết cho từng loại tài nguyên
   - Áp dụng caching thông minh để giảm tải API và tăng tốc độ truy cập

2. **Prompt Engineering**:
   - Thiết kế cấu trúc prompt rõ ràng với các trường bắt buộc và tùy chọn
   - Áp dụng validation để đảm bảo prompt đáp ứng các yêu cầu kỹ thuật
   - Tạo template cho các loại prompt phổ biến để tăng hiệu quả
   - Triển khai hệ thống gợi ý để cải thiện prompt không rõ ràng

3. **Sampling Optimization**:
   - Điều chỉnh sampling parameters phù hợp với từng loại dữ liệu
   - Cân bằng giữa độ chính xác và đa dạng trong kết quả
   - Thu thập feedback để cải thiện chiến lược sampling theo thời gian
   - Triển khai các chỉ số đánh giá chất lượng sampling

## Roadmap phát triển tương lai

### Tính năng API mới
1. **Tích hợp thêm các công cụ Atlassian**:
   - BitBucket for code management
   - Trello for task management
   - ServiceDesk for customer support
   - Bamboo và Opsgenie cho CI/CD và incident management

2. **Mở rộng các API hiện có**:
   - Thêm tùy chọn mở rộng cho getPage (lấy thêm thông tin về ancestors, descendants)
   - Thêm hỗ trợ cho update nhiều fields cùng lúc
   - Thêm hỗ trợ bulk operations (create/update nhiều issues cùng lúc)

### Cải tiến hiệu suất
1. **Caching và Optimizations**:
   - Caching đáp ứng với Redis hoặc Memcached
   - Parallel API calls
   - Batch requests
   - Streaming responses

2. **Rate Limiting thông minh**:
   - Đo lường và quản lý tỉ lệ sử dụng API
   - Adaptive rate limiting dựa trên phản hồi từ server
   - Ưu tiên các yêu cầu quan trọng

### Tăng cường bảo mật
1. **Authentication và Authorization**:
   - Hỗ trợ multiple authentication methods (Basic, OAuth)
   - Encryption cho data at rest
   - Giới hạn phạm vi truy cập (scopes)
   - Audit logging

2. **Data Protection**:
   - Masking dữ liệu nhạy cảm trong logs
   - Sanitizing dữ liệu đầu vào
   - Content security policies

### DevOps và deployment
1. **Containerization**:
   - Docker images cho dễ dàng triển khai
   - Kubernetes manifests cho orchestration
   - Health checks và readiness probes

2. **Monitoring và Observability**:
   - Prometheus metrics
   - Grafana dashboards
   - Distributed tracing với OpenTelemetry
   - Alerting cho các vấn đề quan trọng 

## Triển khai các MCP Server Capabilities

Dựa trên kiến trúc đầy đủ của MCP, chúng ta cần bổ sung và triển khai các capabilities quan trọng sau đây vào server hiện tại:

### 1. Resources

Resources là các tài nguyên mà agent có thể truy cập và sử dụng thông qua MCP Server. Việc triển khai Resources đóng vai trò quan trọng trong kiến trúc MCP:

- **Định nghĩa Resources**:
  - Xác định các loại tài nguyên Atlassian có thể truy cập (Issues, Pages, Spaces, Projects)
  - Tạo schema cho mỗi loại tài nguyên để xác thực và mô tả
  - Phân loại resources theo domain (Jira, Confluence, Admin)

- **Triển khai Resource API**:
  - Tạo endpoints cho việc liệt kê các resources có sẵn
  - Xây dựng hệ thống kiểm soát truy cập cho từng loại resource
  - Quản lý metadata của resources (usage limits, descriptions, permissions)

- **Quản lý Resource Cache**:
  - Triển khai caching cho resources thường xuyên truy cập
  - Thiết lập cơ chế invalidation cache hiệu quả
  - Theo dõi resource usage và optimize performance

### 2. Prompts

Prompts là các yêu cầu được gửi đến MCP Server để xử lý. Việc quản lý và định dạng prompts đúng cách sẽ cải thiện khả năng tương tác:

- **Định nghĩa Prompt Schemas**:
  - Thiết kế cấu trúc prompt chuẩn cho các tác vụ Atlassian
  - Xác định các thành phần bắt buộc và tùy chọn của prompt
  - Tạo templates cho các loại prompt phổ biến (issue creation, page search)

- **Xử lý Prompt**:
  - Xây dựng logic để phân tích và hiểu prompt từ user
  - Triển khai validation và normalization cho prompts
  - Phát triển hệ thống routing để chuyển prompt đến tool handler phù hợp

- **Tối ưu hóa Prompt**:
  - Xây dựng cơ chế gợi ý để cải thiện prompts không rõ ràng
  - Triển khai prompt history để học từ các tương tác trước đó
  - Phát triển khả năng phản hồi incremental cho prompts phức tạp

### 3. Sampling

Sampling cho phép MCP Server tạo ra các phản hồi đa dạng và phù hợp với yêu cầu cụ thể:

- **Cài đặt Sampling Parameters**:
  - Xác định các tham số sampling cơ bản (temperature, top_k, top_p)
  - Thiết lập sampling configuration mặc định cho từng loại tool
  - Xây dựng API để client có thể điều chỉnh sampling parameters

- **Triển khai Sampling Strategies**:
  - Phát triển thuật toán để tạo responses đa dạng và hữu ích
  - Cài đặt các chiến lược sampling khác nhau cho các loại dữ liệu khác nhau
  - Triển khai cơ chế để cân bằng giữa độ chính xác và đa dạng

- **Đánh giá và Cải thiện Sampling**:
  - Thu thập phản hồi về chất lượng các responses được sampling
  - Phân tích hiệu suất của các chiến lược sampling khác nhau
  - Tối ưu hóa sampling parameters dựa trên phản hồi người dùng

## Kế hoạch triển khai chi tiết

### Phase 1: Thiết kế và lập kế hoạch (1-2 tuần)
- Phân tích yêu cầu chi tiết cho mỗi capability
- Thiết kế kiến trúc và các giao diện API
- Xác định các dependencies và công nghệ cần thiết

### Phase 2: Triển khai Resources (2-3 tuần)
- Xây dựng schema và API cho resources
- Tích hợp với hệ thống quản lý tài nguyên Atlassian
- Triển khai caching và access control

### Phase 3: Triển khai Prompts (2-3 tuần)
- Phát triển prompt schema và validation
- Xây dựng hệ thống xử lý và routing prompt
- Triển khai prompt history và suggestion system

### Phase 4: Triển khai Sampling (1-2 tuần)
- Cài đặt sampling parameters và configuration
- Phát triển các chiến lược sampling
- Xây dựng hệ thống đánh giá chất lượng sampling

### Phase 5: Tích hợp và Kiểm thử (2 tuần)
- Tích hợp tất cả các capabilities vào MCP Server
- Kiểm thử toàn diện các tính năng
- Tối ưu hóa hiệu suất và sửa lỗi

### Phase 6: Triển khai và Giám sát (1 tuần)
- Triển khai phiên bản mới với đầy đủ capabilities
- Thiết lập hệ thống giám sát và đánh giá
- Thu thập phản hồi từ người dùng và cải thiện liên tục

## Tài liệu tham khảo
- [MCP Server Architecture Documentation](https://github.com/user/mcp-server-docs)
- [MCP Capabilities Guide](https://github.com/user/mcp-capabilities-guide)
- [Model Context Protocol Specification](https://github.com/anthropics/anthropic-cookbook/tree/main/mcp) 