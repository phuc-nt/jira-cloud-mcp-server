# MCP Trong Thực Tiễn: Luồng Hoạt Động Đầy Đủ Với Atlassian

Tài liệu này sẽ trình bày chi tiết quy trình làm việc hoàn chỉnh của MCP khi tích hợp với các hệ thống Atlassian như Jira và Confluence. Thông qua các ví dụ thực tế, bạn sẽ thấy được cách các thành phần khác nhau của MCP tương tác để tạo ra trải nghiệm mượt mà cho người dùng.

## Quy Trình Tổng Quan

Trước khi đi vào các ví dụ cụ thể, hãy hiểu về luồng tương tác cơ bản:

1. **Người dùng tương tác** với Host Application (VS Code + Cline)
2. **Host Application** gửi yêu cầu đến mô hình AI
3. **Mô hình AI** xác định cần tools/resources nào
4. **MCP Client** nhận yêu cầu từ mô hình và gửi tới MCP Server
5. **MCP Server** xử lý yêu cầu và tương tác với Atlassian API
6. **Kết quả** được trả lại theo đường ngược lại tới người dùng

## Ví Dụ 1: "Tổng hợp trạng thái dự án DEV"

### Bước 1: Người dùng yêu cầu
Người dùng nhập vào VS Code: "Tổng hợp trạng thái hiện tại của dự án DEV"

### Bước 2: Host Application và AI xử lý ban đầu
- Host Application (VS Code + Cline) chuyển yêu cầu tới Claude
- Claude phân tích và xác định cần phải lấy thông tin từ Jira

### Bước 3: MCP Client tương tác với MCP Server

```javascript
// Luồng giao tiếp Client - Server
client.sendMessage({
  type: "resourceRequest",
  id: "request-1",
  resource: "jira://projects/DEV/issues",
  parameters: {
    statuses: ["In Progress", "Review", "Done"]
  }
});
```

### Bước 4: MCP Server xử lý yêu cầu với Atlassian API

```javascript
// Trong MCP Server
async function handleResourceRequest(request) {
  const { resource, parameters } = request;
  
  if (resource === "jira://projects/DEV/issues") {
    // Kết nối với Jira API
    const issues = await jiraClient.searchIssues(
      `project = DEV AND status in (${parameters.statuses.join(", ")})`
    );
    
    return {
      type: "resourceResponse",
      id: request.id,
      resource: request.resource,
      status: "success",
      body: {
        contents: issues.map(issue => ({
          key: issue.key,
          summary: issue.fields.summary,
          status: issue.fields.status.name,
          assignee: issue.fields.assignee?.displayName || "Unassigned"
        }))
      }
    };
  }
  // ... xử lý các resource khác
}
```

### Bước 5: MCP Client nhận phản hồi và chuyển tới AI

Claude nhận được dữ liệu từ Jira và quyết định cần thêm thông tin về lịch sử các issues:

```javascript
client.sendMessage({
  type: "resourceRequest",
  id: "request-2",
  resource: "jira://projects/DEV/changelog",
  parameters: {
    days: 7
  }
});
```

### Bước 6: MCP Server xử lý yêu cầu bổ sung

```javascript
// Server xử lý yêu cầu changelog
const changelog = await jiraClient.getProjectChangelog("DEV", parameters.days);
return {
  type: "resourceResponse",
  id: request.id,
  resource: request.resource,
  status: "success",
  body: {
    contents: changelog
  }
};
```

### Bước 7: Mô hình AI xử lý dữ liệu và tạo kết quả

Claude nhận tất cả dữ liệu từ Jira và bắt đầu tổng hợp. Server có thể yêu cầu AI tạo ra phân tích chuyên sâu thông qua Sampling:

```javascript
// Server yêu cầu AI phân tích
server.sendMessage({
  type: "samplingRequest",
  id: "sampling-1",
  prompt: {
    messages: [
      {
        role: "system",
        content: "Phân tích dữ liệu dự án Jira và tạo báo cáo tổng quan."
      },
      {
        role: "user",
        content: `Dự án: DEV\nIssues: ${JSON.stringify(issues)}\nChangelog: ${JSON.stringify(changelog)}`
      }
    ]
  }
});
```

### Bước 8: Hiển thị kết quả cho người dùng

Claude tạo ra báo cáo chi tiết về trạng thái dự án từ dữ liệu thu thập được và hiển thị cho người dùng:

```
# Báo Cáo Trạng Thái Dự Án DEV

## Tóm Tắt
- 12 issues đang In Progress
- 5 issues đang Review
- 23 issues hoàn thành trong 7 ngày qua
- Tiến độ hoàn thành: 72% (so với kế hoạch 65%)

## Issues Cần Chú Ý
- DEV-123: "Tích hợp API thanh toán" - Đã trong In Progress 5 ngày
- DEV-145: "Sửa lỗi bảo mật XSS" - Cần review gấp

## Xu Hướng Sprint
- Tốc độ giải quyết issues tăng 15% so với sprint trước
- Số lượng issues reopened giảm 30%

## Khuyến Nghị
- Cần thêm reviewer cho 3 PRs đang chờ review quá lâu
- Cân nhắc chuyển 2 issues không được assign cho sprint tiếp theo
```

## Ví Dụ 2: "Tôi đã xong task XXX-01"

### Bước 1: Người dùng thông báo hoàn thành task
Người dùng nhập: "Tôi đã xong task XXX-01"

### Bước 2: Model nhận diện intent và yêu cầu MCP Client lấy thông tin

```javascript
// Model yêu cầu thông tin về issue
client.sendMessage({
  type: "resourceRequest",
  id: "request-1",
  resource: "jira://issues/XXX-01",
  parameters: {}
});
```

### Bước 3: MCP Server lấy thông tin chi tiết về issue

```javascript
// Server xử lý yêu cầu
const issueDetails = await jiraClient.getIssue("XXX-01");
return {
  type: "resourceResponse",
  id: request.id,
  resource: request.resource,
  status: "success",
  body: {
    contents: {
      key: issueDetails.key,
      summary: issueDetails.fields.summary,
      status: issueDetails.fields.status.name,
      transitions: issueDetails.transitions.map(t => ({
        id: t.id,
        name: t.name,
        to: t.to.name
      }))
    }
  }
};
```

### Bước 4: Model phân tích và đề xuất hành động
Claude phân tích dữ liệu và thấy rằng task hiện đang ở trạng thái "In Progress" và có thể chuyển sang "Done"

### Bước 5: Model sử dụng Tool để thực hiện hành động

```javascript
// Model gọi tool để chuyển trạng thái issue
client.sendMessage({
  type: "toolCall",
  id: "tool-1",
  tool: "jira.transitionIssue",
  parameters: {
    issueKey: "XXX-01",
    transitionId: "31" // ID của transition "Done"
  }
});
```

### Bước 6: MCP Server xử lý yêu cầu chuyển trạng thái

```javascript
// Server xử lý yêu cầu tool
async function handleToolCall(request) {
  const { tool, parameters } = request;
  
  if (tool === "jira.transitionIssue") {
    try {
      await jiraClient.transitionIssue(parameters.issueKey, {
        transition: { id: parameters.transitionId }
      });
      
      return {
        type: "toolResponse",
        id: request.id,
        tool: request.tool,
        status: "success",
        body: {
          content: `Đã chuyển issue ${parameters.issueKey} sang trạng thái Done`
        }
      };
    } catch (error) {
      return {
        type: "toolResponse",
        id: request.id,
        tool: request.tool,
        status: "error",
        body: {
          content: `Không thể chuyển trạng thái: ${error.message}`
        }
      };
    }
  }
  // ... xử lý các tools khác
}
```

### Bước 7: Xác nhận từ người dùng và cập nhật comment

Claude hỏi người dùng xem có muốn thêm comment vào issue không. Người dùng xác nhận.

```javascript
// Model gọi tool để thêm comment
client.sendMessage({
  type: "toolCall",
  id: "tool-2",
  tool: "jira.addComment",
  parameters: {
    issueKey: "XXX-01",
    comment: "Hoàn thành tất cả các yêu cầu. Đã test trên môi trường staging."
  }
});
```

### Bước 8: MCP Server cập nhật comment và báo cáo kết quả

```javascript
// Server xử lý yêu cầu comment
await jiraClient.addComment(parameters.issueKey, parameters.comment);
return {
  type: "toolResponse",
  id: request.id,
  tool: request.tool,
  status: "success",
  body: {
    content: `Đã thêm comment vào issue ${parameters.issueKey}`
  }
};
```

### Bước 9: Hiển thị kết quả cho người dùng

Claude tạo một phản hồi tóm tắt cho người dùng:

```
Đã hoàn thành các hành động sau cho XXX-01 "Tích hợp API đăng nhập":

✅ Chuyển trạng thái từ "In Progress" sang "Done"
✅ Thêm comment với nội dung chi tiết về việc hoàn thành

Bạn có muốn tôi cập nhật Confluence với thông tin về API đã tích hợp không?
```

## Vai Trò Của Các Capabilities

Qua các ví dụ, chúng ta thấy vai trò quan trọng của từng loại capability:

### 1. Resources
- **Jira Issues**: `jira://projects/{key}/issues` - Lấy danh sách issues
- **Issue Details**: `jira://issues/{key}` - Chi tiết về một issue
- **User Info**: `jira://users/current` - Thông tin về người dùng hiện tại
- **Confluence Pages**: `confluence://spaces/{key}/pages` - Lấy danh sách trang

### 2. Tools
- **Issue Management**: `jira.transitionIssue`, `jira.addComment`, `jira.createIssue`
- **Content Management**: `confluence.updatePage`, `confluence.createPage`
- **Search**: `jira.searchIssues`, `confluence.search`

### 3. Prompts
- **Report Templates**: Templates cho báo cáo trạng thái dự án
- **Issue Templates**: Templates chuẩn cho việc tạo issues
- **Documentation Templates**: Templates cho tài liệu Confluence

### 4. Sampling
- **Advanced Analysis**: Phân tích dữ liệu để tạo báo cáo
- **Content Generation**: Tạo nội dung cho documentation
- **Suggestion Engine**: Đề xuất actions dựa trên context

## Lợi Ích Của Kiến Trúc MCP Trong Thực Tiễn

1. **Tách biệt trách nhiệm rõ ràng**:
   - MCP Client xử lý giao tiếp với AI
   - MCP Server xử lý giao tiếp với Atlassian APIs
   - AI tập trung vào xử lý ngôn ngữ tự nhiên

2. **Bảo mật tăng cường**:
   - MCP Server quản lý xác thực với Atlassian APIs
   - MCP Client kiểm soát hành động mà AI được phép thực hiện
   - Người dùng có quyền xác nhận các hành động quan trọng

3. **Trải nghiệm người dùng liền mạch**:
   - Người dùng chỉ tương tác với Host Application
   - Không cần chuyển đổi giữa nhiều ứng dụng
   - AI trở thành "trợ lý ảo" hiểu biết về hệ thống Atlassian

4. **Mở rộng dễ dàng**:
   - Thêm capabilities mới không yêu cầu thay đổi mô hình
   - Hỗ trợ nhiều Atlassian products (Jira, Confluence, Bitbucket)
   - Dễ dàng cập nhật khi APIs thay đổi

## Kết Luận

Kiến trúc MCP cung cấp một cách tiếp cận mạnh mẽ và linh hoạt để tích hợp AI với các hệ thống Atlassian. Thông qua các ví dụ thực tế, chúng ta thấy được cách các thành phần khác nhau của MCP phối hợp để tạo ra trải nghiệm mượt mà cho người dùng, đồng thời duy trì tính bảo mật và khả năng mở rộng. 