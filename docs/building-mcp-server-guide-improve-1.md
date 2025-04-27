# Giới Thiệu Về MCP Với Đầy Đủ Các Thành Phần

Model Context Protocol (MCP) là một chuẩn mở được phát triển bởi Anthropic, giúp kết nối các ứng dụng AI với các nguồn dữ liệu và công cụ bên ngoài. MCP được ví như "USB-C cho AI", cung cấp một giao thức chuẩn để các mô hình AI có thể tương tác với các hệ thống khác nhau mà không cần phải xây dựng tích hợp riêng cho từng hệ thống.

## Kiến Trúc MCP Đầy Đủ

MCP bao gồm bốn thành phần chính tạo nên một hệ sinh thái hoàn chỉnh:

### 1. Host Application
- **Định nghĩa**: Ứng dụng mà người dùng trực tiếp tương tác
- **Mục đích**: Cung cấp giao diện người dùng, quản lý trải nghiệm, và chứa MCP Client
- **Ví dụ**: Claude Desktop, Cursor IDE, Zed, VSCode với plugin Cline
- **Đặc điểm**: 
  - Quản lý vòng đời và chính sách bảo mật
  - Kiểm soát quyền, ủy quyền người dùng, và thực thi yêu cầu đồng ý
  - Giám sát cách tích hợp mô hình AI hoặc ngôn ngữ diễn ra

### 2. MCP Client
- **Định nghĩa**: Thành phần kỹ thuật được nhúng trong Host Application
- **Mục đích**: Kết nối với MCP Server, quản lý phiên, xử lý yêu cầu/phản hồi
- **Đặc điểm**:
  - Duy trì kết nối 1:1 với server
  - Mỗi host có thể chạy nhiều client để kết nối với nhiều server khác nhau
  - Xử lý đàm phán về khả năng và điều phối tin nhắn
  - Duy trì ranh giới bảo mật

### 3. MCP Server
- **Định nghĩa**: Chương trình nhẹ kết nối với API/dịch vụ bên ngoài
- **Mục đích**: Cung cấp khả năng tương tác với dịch vụ cụ thể qua MCP
- **Ví dụ**: Jira MCP Server, Confluence MCP Server, GitHub MCP Server
- **Đặc điểm**:
  - Quản lý authentication với dịch vụ bên ngoài
  - Xử lý requests và định dạng responses
  - Cung cấp các khả năng (capabilities) thông qua giao thức MCP

### 4. Khả Năng (Capabilities)

MCP Server cung cấp bốn loại khả năng chính:

#### a. Resources (Tài nguyên)
- **Định nghĩa**: Dữ liệu được server cung cấp cho client
- **Mục đích**: Cung cấp dữ liệu mà không thực hiện các phép tính phức tạp
- **Đặc điểm**:
  - Hoạt động tương tự như các endpoint GET trong REST API
  - Không gây ra tác dụng phụ (side effects)
  - Là một phần của ngữ cảnh/yêu cầu gửi đến LLM
  - Có thể được đăng ký, truy vấn và theo dõi thay đổi
- **Ví dụ Jira**:
  - `jira://projects` - Danh sách các dự án
  - `jira://projects/DEV/members` - Thành viên của dự án DEV
  - `jira://issues/DEV-123` - Thông tin chi tiết về issue DEV-123

#### b. Tools (Công cụ)
- **Định nghĩa**: Các hàm có thể gọi để thực hiện hành động
- **Mục đích**: Thực hiện các hành động và gây ra tác dụng phụ
- **Đặc điểm**:
  - Tương tự như function calling trong các API của OpenAI/Anthropic
  - Có thể thay đổi trạng thái hệ thống
  - Thực hiện các tính toán phức tạp
  - Có thể gọi API bên ngoài để thực hiện hành động
- **Ví dụ Jira**:
  - `createIssue` - Tạo issue mới
  - `transitionIssue` - Chuyển trạng thái của issue
  - `assignIssue` - Gán issue cho người dùng

#### c. Prompts (Mẫu câu)
- **Định nghĩa**: Template tin nhắn được định nghĩa bởi server
- **Mục đích**: Chuẩn hóa tương tác với LLM cho các nhiệm vụ cụ thể
- **Đặc điểm**:
  - Có tên, mô tả và tham số (với schema)
  - Có thể nhúng resources
  - Sử dụng `prompts/list` để khám phá và `prompts/get` để sử dụng
  - Được kiểm soát bởi người dùng
- **Ví dụ Jira**:
  - `project-status-summary` - Template báo cáo trạng thái dự án
  - `complete-task` - Template hỗ trợ cập nhật trạng thái task

#### d. Sampling (Lấy mẫu)
- **Định nghĩa**: Cho phép server yêu cầu client thực hiện AI completion
- **Mục đích**: Tạo điều kiện cho hành vi tác nhân và tương tác LLM đệ quy
- **Đặc điểm**:
  - Đảo ngược luồng truyền thống: server yêu cầu client thực hiện hành động
  - Cho phép server sử dụng AI để đưa ra quyết định thông minh
  - Client kiểm soát mô hình nào được sử dụng
  - Người dùng có thể xem xét hoặc sửa đổi prompt và kết quả
- **Ví dụ Jira**:
  - Server yêu cầu LLM tạo mô tả issue chuyên nghiệp
  - Server yêu cầu LLM phân tích comment để xác định sentiment

## Quy Trình MCP Đầy Đủ Với Ví Dụ Jira và Confluence

### Ví dụ 1: "Tổng hợp trạng thái dự án DEV"

#### Bước 1: Người dùng tương tác với Host Application
**Mục đích**: Bắt đầu quá trình bằng cách người dùng nhập yêu cầu thông tin về trạng thái dự án.
```
Người dùng nhập: "Tổng hợp trạng thái dự án DEV" vào Claude Desktop
```

#### Bước 2: Host Application (Claude Desktop) xử lý yêu cầu
**Mục đích**: Phân tích ngữ nghĩa yêu cầu để xác định nhu cầu thông tin và nguồn dữ liệu cần truy cập.
```typescript
// LLM nhận diện yêu cầu liên quan đến dự án Jira
// AI xác định cần dữ liệu từ Jira MCP Server
```

#### Bước 3: MCP Client khám phá khả năng của MCP Server
**Mục đích**: Xác định các resources khả dụng từ server để định hướng các bước tiếp theo.
```typescript
// MCP Client yêu cầu danh sách resources có sẵn
const resourcesResult = await mcpClient.request({
  method: "resources/list"
});
// MCP Client tìm resource phù hợp
const projectResource = resourcesResult.resources.find(r => 
  r.uri.startsWith("jira://projects/")
);
```

#### Bước 4: MCP Client yêu cầu dữ liệu resources
**Mục đích**: Truy vấn cụ thể về dự án "DEV" để lấy thông tin cơ bản làm nền tảng cho báo cáo.
```typescript
// Client yêu cầu dữ liệu cụ thể về dự án DEV
const projectData = await mcpClient.request({
  method: "resources/read",
  params: { uri: "jira://projects/DEV" }
});
```

#### Bước 5: MCP Server xử lý yêu cầu resource
**Mục đích**: Gọi API Jira để lấy dữ liệu thực tế và chuyển đổi sang định dạng chuẩn MCP.
```typescript
// Bên trong MCP Server - hàm xử lý resource
async function getProjectResource(projectKey, exchange) {
  try {
    // Gọi Jira API để lấy dữ liệu
    const projectInfo = await jiraClient.getProject(projectKey);
    const issueStats = await jiraClient.getIssueStats(projectKey);
    
    // Định dạng và trả về dữ liệu
    return {
      type: "application/json",
      data: {
        id: projectInfo.id,
        key: projectInfo.key,
        name: projectInfo.name,
        // ...
      }
    };
  } catch (error) {
    console.error("Failed to fetch project:", error);
    throw error;
  }
}
```

#### Bước 6: MCP Client tìm kiếm prompt phù hợp
**Mục đích**: Khám phá các template tin nhắn được định nghĩa sẵn cho tác vụ báo cáo dự án.
```typescript
// MCP Client liệt kê prompt có sẵn
const promptsResult = await mcpClient.request({
  method: "prompts/list"
});
// MCP Client tìm prompt phù hợp
const statusPrompt = promptsResult.prompts.find(p => 
  p.name === "project-status-summary"
);
```

#### Bước 7: MCP Client yêu cầu prompt với tham số
**Mục đích**: Lấy template báo cáo chuyên nghiệp có cấu trúc, được điền các tham số phù hợp.
```typescript
// MCP Client lấy prompt với tham số
const promptTemplate = await mcpClient.request({
  method: "prompts/get",
  params: {
    name: "project-status-summary",
    arguments: { 
      projectKey: "DEV", 
      timeframe: "tuần này" 
    }
  }
});
```

#### Bước 8: MCP Server xử lý yêu cầu prompt
**Mục đích**: Lấy dữ liệu chi tiết từ Jira và tạo ra template báo cáo đã điền đầy đủ thông tin.
```typescript
// Bên trong MCP Server - hàm xử lý prompt
async function getProjectStatusPrompt(input) {
  // Lấy dữ liệu từ Jira API
  const projectInfo = await jiraClient.getProject(input.projectKey);
  const issueStats = await jiraClient.getIssueStats(input.projectKey, input.timeframe);
  
  // Tạo nội dung prompt
  return {
    messages: [{
      role: "user",
      content: {
        type: "text",
        text: `Hãy tổng hợp trạng thái dự án ${input.projectKey} dựa trên thông tin sau:
        
Tổng số issues: ${issueStats.total}
Đã hoàn thành: ${issueStats.done}
...`
      }
    }]
  };
}
```

#### Bước 9: Host Application sử dụng prompt với LLM
**Mục đích**: Cung cấp cho LLM prompt có cấu trúc tốt để tạo ra báo cáo trạng thái dự án chất lượng cao.
```
// Claude Desktop hiển thị kết quả từ prompt cho người dùng
// LLM tạo báo cáo tổng hợp dựa trên template và dữ liệu
```

### Ví dụ 2: "Tôi đã xong task XXX-01"

#### Bước 1-3: Tương tự như ví dụ 1

#### Bước 4: MCP Client yêu cầu thông tin về issue
**Mục đích**: Xác định trạng thái hiện tại và các thông tin chi tiết của task để biết cách xử lý.
```typescript
// MCP Client đọc resource để lấy thông tin issue
const issueData = await mcpClient.request({
  method: "resources/read",
  params: { uri: "jira://issues/XXX-01" }
});
```

#### Bước 5-9: Tương tự như ví dụ 1

#### Bước 10: MCP Client gọi Tool để thực hiện hành động
**Mục đích**: Thực hiện thao tác thực tế trên Jira để cập nhật trạng thái task theo yêu cầu người dùng.
```typescript
// MCP Client gọi tool để cập nhật issue
const toolResult = await mcpClient.request({
  method: "tools/call",
  params: {
    name: "transitionIssue",
    arguments: {
      issueKey: "XXX-01",
      transitionName: "Done",
      comment: "Đã hoàn thành tính năng đăng nhập"
    }
  }
});
```

#### Bước 11: MCP Server xử lý yêu cầu tool
**Mục đích**: Tìm ID chuyển đổi trạng thái phù hợp, thực hiện chuyển đổi và thêm ghi chú.
```typescript
// MCP Server handler cho tool transitionIssue
async function transitionIssueHandler(params, exchange) {
  try {
    // Tìm ID của transition "Done"
    const transitions = await jiraClient.getTransitions(params.issueKey);
    const doneTransition = transitions.find(t => 
      t.name === params.transitionName
    );
    
    // Thực hiện transition và thêm comment
    await jiraClient.transitionIssue(params.issueKey, doneTransition.id, {
      comment: params.comment
    });
    
    // Trả về kết quả thành công
    return {
      content: [{ 
        type: "text", 
        text: `Đã chuyển ${params.issueKey} sang trạng thái ${params.transitionName}`
      }]
    };
  } catch (error) {
    // Xử lý lỗi
    return {
      content: [{ type: "text", text: `Lỗi: ${error.message}` }],
      isError: true
    };
  }
}
```

#### Bước 12: MCP Server có thể yêu cầu Sampling từ Client
**Mục đích**: Tận dụng khả năng sáng tạo của LLM để tạo ra nội dung ghi chú chuyên nghiệp, phong phú.
```typescript
// MCP Server yêu cầu AI tạo summary tốt hơn
const samplingResult = await exchange.createMessage({
  messages: [{
    role: "user",
    content: {
      type: "text",
      text: `Tôi đã hoàn thành task "${issueDetails.key}: ${issueDetails.summary}". 
      Hãy viết một comment chuyên nghiệp mô tả việc hoàn thành task này.`
    }
  }],
  systemPrompt: "Bạn là một chuyên gia Jira, hãy viết comment chuyên nghiệp."
});
```

#### Bước 13: Kết thúc quy trình
**Mục đích**: Gửi xác nhận đến người dùng về hành động đã được thực hiện thành công trên Jira.
```
// Host Application hiển thị kết quả từ MCP Server
// Người dùng nhận được xác nhận rằng task đã được cập nhật thành công
```

## Các Transportation Methods

MCP hỗ trợ nhiều phương thức transport giữa client và server:

1. **STDIO**: Dễ triển khai, phù hợp cho việc nhúng server trong client
2. **HTTP/SSE (Server-Sent Events)**: Phù hợp cho web và microservices
3. **WebSocket**: Tối ưu cho giao tiếp hai chiều thời gian thực

Mỗi phương thức được chọn dựa trên yêu cầu cụ thể của ứng dụng và môi trường triển khai.

## Lợi Ích Của MCP

- **Tách biệt trách nhiệm**: AI tập trung vào xử lý ngôn ngữ, MCP Server tập trung vào tương tác với API
- **Mở rộng dễ dàng**: Thêm công cụ mới mà không cần huấn luyện lại mô hình
- **Bảo mật tốt hơn**: Kiểm soát được các hành động mà AI có thể thực hiện
- **Độc lập với mô hình**: Hoạt động với bất kỳ mô hình AI nào hỗ trợ gọi công cụ
- **Giảm thiểu vấn đề M×N**: Chuyển từ M×N tích hợp thành M+N tích hợp đơn giản hơn

Với kiến trúc đầy đủ này, MCP cung cấp một giao diện thống nhất cho việc tích hợp AI với các hệ thống bên ngoài, giúp đơn giản hóa quá trình phát triển và mở rộng khả năng của các ứng dụng AI.