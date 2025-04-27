# Chi Tiết Về Resources và Prompts Trong MCP

Tài liệu này cung cấp thông tin chi tiết về hai khả năng quan trọng của MCP Server: Resources và Prompts. Cả hai đều là thành phần thiết yếu giúp tạo nên trải nghiệm tương tác phong phú giữa AI và các hệ thống bên ngoài.

## Resources (Tài nguyên)

Resources trong MCP là cơ chế cho phép MCP Server cung cấp dữ liệu có cấu trúc cho AI thông qua MCP Client.

### Định nghĩa và Đặc điểm

Resources là khả năng của MCP Server với các đặc điểm chính:
- Cung cấp dữ liệu mà không thực hiện các phép tính phức tạp
- Không gây ra tác dụng phụ (side effects)
- Hoạt động tương tự như các endpoint GET trong REST API
- Là một phần của ngữ cảnh/yêu cầu gửi đến LLM
- Có thể được đăng ký, truy vấn và theo dõi thay đổi

### Cách Resources hoạt động

MCP Client có thể tương tác với resources thông qua các phương thức:
- **resources/list**: Liệt kê các resources có sẵn
- **resources/read**: Đọc nội dung của một resource cụ thể
- **resources/subscribe**: Đăng ký nhận thông báo khi resource thay đổi
- **resources/unsubscribe**: Hủy đăng ký nhận thông báo

MCP Server cũng có thể thông báo cho clients khi resources thay đổi:
- **notifications/resources/list_changed**: Khi danh sách resources thay đổi
- **notifications/resources/updated**: Khi nội dung của một resource cụ thể thay đổi

### Định nghĩa Resource trong MCP Server

```typescript
// Đăng ký một resource để cung cấp dữ liệu về dự án Jira
server.resource(
  "jira://projects", // URI của resource
  "Danh sách các dự án Jira", // Mô tả
  async (params, exchange) => {
    try {
      // Gọi Jira API để lấy danh sách dự án
      const projects = await jiraClient.getProjects();
      
      // Trả về dữ liệu resource có cấu trúc
      return {
        type: "application/json",
        data: projects.map(p => ({
          id: p.id,
          key: p.key,
          name: p.name,
          lead: p.lead.displayName
        }))
      };
    } catch (error) {
      console.error("Failed to fetch projects:", error);
      throw error;
    }
  }
);
```

### Ví dụ về Resources trong Jira và Confluence

#### Resources Jira:
- **Thông tin dự án**: `jira://projects`, `jira://projects/DEV`, `jira://projects/DEV/members`
- **Thông tin issues**: `jira://issues`, `jira://issues/DEV-123`, `jira://issues/DEV-123/history`
- **Thông tin sprint**: `jira://projects/DEV/sprints`, `jira://projects/DEV/sprints/current`

#### Resources Confluence:
- **Không gian**: `confluence://spaces`, `confluence://spaces/TEAM`
- **Trang**: `confluence://pages`, `confluence://pages/123456`
- **Blog**: `confluence://blogs`, `confluence://blogs/recent`

### Lợi ích của Resources

- **Dữ liệu luôn mới nhất**: Thông tin luôn được cập nhật từ API
- **Hiệu quả về bộ nhớ**: Không cần lưu trữ và đồng bộ hóa dữ liệu lớn
- **Linh hoạt**: Dễ dàng mở rộng để hỗ trợ các loại resources mới
- **Bảo mật tốt hơn**: Quyền truy cập được kiểm soát theo thời gian thực

## Prompts (Mẫu câu)

Prompts trong MCP là các template tin nhắn được định nghĩa bởi server để client sử dụng với LLM, giúp chuẩn hóa tương tác.

### Định nghĩa và Đặc điểm

Prompts là khả năng của MCP Server với các đặc điểm chính:
- Là các template có cấu trúc, tái sử dụng được mà server hiển thị cho clients
- Được kiểm soát bởi người dùng thông qua client
- Có tên, mô tả và tham số (với schema)
- Có thể nhúng resources
- Sử dụng `prompts/list` để khám phá và `prompts/get` để sử dụng

### Cách Prompts hoạt động

Prompts hoạt động theo quy trình:
1. Client khám phá các prompts từ server thông qua `prompts/list`
2. Client (hoặc người dùng) chọn prompt phù hợp
3. Client lấy prompt kèm tham số thông qua `prompts/get`
4. Client sử dụng prompt để tạo message gửi đến LLM
5. LLM phản hồi, có thể bao gồm yêu cầu gọi tool

### Định nghĩa Prompt trong MCP Server

```typescript
import { z } from "zod";

// Schema cho tham số đầu vào
const projectStatusSchema = z.object({
  projectKey: z.string().describe("Mã dự án Jira (ví dụ: DEV, MARKETING)"),
  timeframe: z.string().optional().describe("Khoảng thời gian báo cáo (ví dụ: 'tuần này', 'tháng trước')")
});

// Đăng ký prompt với server
server.prompt(
  "project-status-summary", // Tên prompt
  "Tạo tổng hợp trạng thái dự án từ Jira", // Mô tả
  projectStatusSchema, // Schema validate tham số
  async (input) => {
    // Lấy dữ liệu dự án từ Jira API
    const projectInfo = await jiraClient.getProject(input.projectKey);
    const issueStats = await jiraClient.getIssueStats(input.projectKey, input.timeframe);
    const sprintInfo = await jiraClient.getCurrentSprint(input.projectKey);
    
    // Tạo nội dung prompt dựa trên dữ liệu thực
    return {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Hãy tổng hợp trạng thái dự án ${input.projectKey} dựa trên thông tin sau:

Tổng số issues: ${issueStats.total}
Đã hoàn thành: ${issueStats.done}
Đang thực hiện: ${issueStats.inProgress}
Backlog: ${issueStats.backlog}
Chặn (Blocked): ${issueStats.blocked}

Sprint hiện tại: "${sprintInfo.name}" (còn ${sprintInfo.daysRemaining} ngày)
Tiến độ sprint: ${sprintInfo.completionPercentage}% công việc đã hoàn thành
Burndown chart: ${sprintInfo.burndownStatus}

Issues ưu tiên cao chưa hoàn thành:
${issueStats.highPriorityIssues.map(issue => `- ${issue.key}: "${issue.summary}"`).join('\n')}

Người chịu trách nhiệm chính: ${projectInfo.lead}`
          }
        }
      ]
    };
  }
);
```

### Ví dụ về Prompts trong Jira và Confluence

#### Prompts Jira:
- **project-status-summary**: Template báo cáo trạng thái dự án
- **complete-task**: Template hỗ trợ cập nhật trạng thái task
- **create-issue**: Template hướng dẫn tạo issue mới

#### Prompts Confluence:
- **page-summary**: Template tóm tắt nội dung trang
- **create-meeting-notes**: Template tạo ghi chú cuộc họp
- **knowledge-search**: Template tìm kiếm kiến thức

### Lợi ích của Prompts

- **Chuẩn hóa tương tác**: Giúp LLM hiểu cách Jira/Confluence hoạt động
- **Hướng dẫn tương tác**: Giúp LLM biết cách diễn giải và phân loại yêu cầu người dùng
- **Giúp LLM ra quyết định tốt hơn**: Với thông tin ngữ cảnh đầy đủ
- **Tạo trải nghiệm nhất quán**: Đảm bảo tương tác với các hệ thống bên ngoài theo cách nhất quán

## Sự khác biệt giữa Resources và Tools

| Resources | Tools |
|-----------|-------|
| Cung cấp dữ liệu (đọc) | Thực hiện hành động (ghi) |
| "Application-controlled" | "Model-controlled" |
| Không gây tác dụng phụ | Có thể thay đổi trạng thái hệ thống |
| Tương tự GET endpoints | Tương tự function calling |
| Ví dụ: `jira://projects` | Ví dụ: `createIssue` |

## Kết hợp Resources, Prompts và Tools

Sức mạnh thực sự của MCP đến từ việc kết hợp cả ba khả năng:

1. **Resources** cung cấp dữ liệu ngữ cảnh từ các hệ thống bên ngoài
2. **Prompts** chuẩn hóa cách LLM hiểu và tương tác với dữ liệu đó
3. **Tools** cho phép LLM thực hiện các hành động dựa trên quyết định của nó

Ví dụ quy trình đầy đủ:
1. Client yêu cầu resource `jira://projects/DEV` để lấy thông tin dự án
2. Client sử dụng prompt `project-status-summary` để tạo báo cáo
3. Dựa trên báo cáo, người dùng quyết định cần tạo issue mới
4. Client gọi tool `createIssue` để thực hiện hành động

Mô hình này tạo ra một hệ sinh thái hoàn chỉnh cho phép AI tương tác hiệu quả với các hệ thống bên ngoài, vừa có thể truy cập dữ liệu, vừa có thể thực hiện hành động, tất cả đều được chuẩn hóa và có cấu trúc.