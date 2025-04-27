# Giới Thiệu Về MCP - Kết Nối AI Với Thế Giới Bên Ngoài

Model Context Protocol (MCP) là một chuẩn mở được phát triển bởi Anthropic, tạo ra một giao thức tiêu chuẩn giúp các hệ thống AI kết nối an toàn và đồng nhất với các công cụ và nguồn dữ liệu bên ngoài. MCP được ví như "USB-C cho AI", cho phép các mô hình ngôn ngữ lớn (LLMs) tương tác với nhiều hệ thống khác nhau mà không cần xây dựng tích hợp riêng cho từng trường hợp.

## Kiến Trúc MCP Đầy Đủ

MCP bao gồm bốn thành phần chính tạo nên một hệ sinh thái hoàn chỉnh:

### 1. Host Application
- **Định nghĩa**: Ứng dụng mà người dùng trực tiếp tương tác
- **Mục đích**: Cung cấp giao diện người dùng, quản lý trải nghiệm, và chứa MCP Client
- **Ví dụ**: Claude Desktop, Cursor IDE, VS Code với Cline
- **Đặc điểm**: 
  - Quản lý vòng đời và chính sách bảo mật
  - Kiểm soát quyền và xác thực người dùng
  - Giám sát tích hợp với mô hình AI

### 2. MCP Client
- **Định nghĩa**: Thành phần kỹ thuật được nhúng trong Host Application
- **Mục đích**: Kết nối với MCP Server, quản lý phiên, xử lý yêu cầu/phản hồi
- **Đặc điểm**:
  - Duy trì kết nối 1:1 với server
  - Mỗi host có thể chạy nhiều client để kết nối với nhiều server
  - Xử lý đàm phán về khả năng và điều phối tin nhắn
  - Duy trì ranh giới bảo mật

### 3. MCP Server
- **Định nghĩa**: Chương trình nhẹ kết nối với API/dịch vụ bên ngoài
- **Mục đích**: Cung cấp khả năng tương tác với dịch vụ cụ thể thông qua MCP
- **Ví dụ**: Atlassian MCP Server (Jira/Confluence), GitHub MCP Server
- **Đặc điểm**:
  - Quản lý xác thực với dịch vụ bên ngoài
  - Xử lý requests và định dạng responses
  - Cung cấp capabilities thông qua giao thức MCP
  - Có thể triển khai local (chạy trên máy người dùng) hoặc cloud (cho nhiều người dùng)

### 4. Các Khả Năng (Capabilities)

MCP Server cung cấp bốn loại khả năng chính:

#### a. Resources (Tài nguyên)
- **Định nghĩa**: Dữ liệu được server cung cấp cho client
- **Mục đích**: Cung cấp dữ liệu mà không thực hiện các phép tính phức tạp
- **Mô hình kiểm soát**: Application-controlled (do ứng dụng kiểm soát)
- **Đặc điểm**:
  - Hoạt động tương tự như các endpoint GET trong REST API
  - Không gây tác dụng phụ (side effects)
  - Có thể static (không tham số) hoặc dynamic (với ResourceTemplate và tham số)
  - Trả về định dạng `{ contents: [...] }`
- **Ví dụ Atlassian**:
  - `jira://projects` - Danh sách các dự án
  - `jira://issues/{issueKey}` - Thông tin chi tiết về issue
  - `confluence://spaces/{spaceKey}/pages` - Danh sách trang trong không gian

**[Xem Chi Tiết Về Resources →](./resources.md)**

#### b. Tools (Công cụ)
- **Định nghĩa**: Các hàm có thể gọi để thực hiện hành động
- **Mục đích**: Thực hiện các hành động và gây tác dụng phụ
- **Mô hình kiểm soát**: Model-controlled (do mô hình AI kiểm soát)
- **Đặc điểm**:
  - Tương tự như function calling trong các API của OpenAI/Anthropic
  - Có thể thay đổi trạng thái hệ thống (CREATE/UPDATE/DELETE)
  - Sử dụng Zod để validation schema mạnh mẽ
  - Trả về định dạng `{ content: [...] }`
- **Ví dụ Atlassian**:
  - `createIssue` - Tạo issue mới
  - `transitionIssue` - Chuyển trạng thái của issue
  - `updatePage` - Cập nhật nội dung trang Confluence

**[Xem Chi Tiết Về Tools →](./tools.md)**

#### c. Prompts (Mẫu câu)
- **Định nghĩa**: Template tin nhắn được định nghĩa bởi server
- **Mục đích**: Chuẩn hóa tương tác với LLM cho các nhiệm vụ cụ thể
- **Mô hình kiểm soát**: Template-oriented (định hướng theo template)
- **Đặc điểm**:
  - Có tên, mô tả và tham số (với Zod schema)
  - Có thể nhúng resources
  - Trả về định dạng `{ messages: [...] }`
  - Tạo ra cấu trúc tin nhắn chuẩn hóa
- **Ví dụ Atlassian**:
  - `jiraIssueCreation` - Template tạo issue chuyên nghiệp
  - `projectStatusSummary` - Template báo cáo trạng thái dự án

**[Xem Chi Tiết Về Prompts →](./prompts.md)**

#### d. Sampling (Lấy mẫu)
- **Định nghĩa**: Cho phép server yêu cầu client thực hiện AI completion
- **Mục đích**: Tạo điều kiện cho hành vi tác nhân và tương tác LLM đệ quy
- **Mô hình kiểm soát**: Server-requested, Client-controlled
- **Đặc điểm**:
  - Đảo ngược luồng truyền thống: server yêu cầu client thực hiện completion
  - Client kiểm soát mô hình nào được sử dụng
  - Server được hưởng lợi từ khả năng AI mà không cần tích hợp trực tiếp
  - Yêu cầu xác nhận `clientCapabilities.sampling` trước khi sử dụng
- **Ví dụ Atlassian**:
  - Server yêu cầu LLM tạo mô tả issue chuyên nghiệp
  - Server yêu cầu LLM phân tích các PR đã merge để tạo release notes

**[Xem Chi Tiết Về Sampling →](./sampling.md)**

## Transportation Methods

MCP hỗ trợ nhiều phương thức transport giữa client và server:

1. **STDIO (Standard Input/Output)**:
   - Phù hợp cho local development và ứng dụng single-user
   - Ưu điểm: Đơn giản, không cần cấu hình mạng, hiệu quả, và an toàn
   - Hạn chế: Không hỗ trợ multi-user, khó mở rộng
   - Phổ biến với Cline trong VS Code

**[Xem Chi Tiết Về STDIO Transport →](./stdio-transport.md)**

2. **HTTP/SSE (Server-Sent Events)**:
   - Phù hợp cho triển khai web và microservices
   - Ưu điểm: Hỗ trợ multi-user, dễ mở rộng, triển khai cloud
   - Hạn chế: Cần cấu hình network, phức tạp hơn STDIO

3. **WebSockets**:
   - Tối ưu cho giao tiếp hai chiều thời gian thực
   - Ít phổ biến hơn hai phương thức trên trong MCP

## Lợi Ích Của MCP

- **Tách biệt trách nhiệm**: AI tập trung vào xử lý ngôn ngữ, MCP Server tập trung vào tương tác với API
- **Mở rộng dễ dàng**: Thêm công cụ mới mà không cần huấn luyện lại mô hình
- **Bảo mật tốt hơn**: Kiểm soát được các hành động mà AI có thể thực hiện
- **Độc lập với mô hình**: Hoạt động với bất kỳ mô hình AI nào hỗ trợ gọi công cụ
- **Giảm thiểu vấn đề M×N**: Chuyển từ M×N tích hợp thành M+N tích hợp đơn giản hơn
- **Kinh nghiệm người dùng nhất quán**: Cung cấp giao diện thống nhất cho các LLM tương tác với các hệ thống khác nhau

Với kiến trúc toàn diện này, MCP trở thành giao thức chuẩn kết nối AI với thế giới bên ngoài, giúp đơn giản hóa quá trình phát triển và mở rộng khả năng của các ứng dụng AI trong môi trường doanh nghiệp hiện đại. 

## Ví Dụ Thực Tiễn

Để hiểu rõ hơn về cách MCP hoạt động trong thực tế, hãy xem các ví dụ chi tiết về quy trình làm việc và luồng tương tác giữa các thành phần.

**[Xem Ví Dụ Thực Tiễn Với Atlassian →](./workflow-examples.md)** 