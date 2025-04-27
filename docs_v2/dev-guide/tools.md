# Chi Tiết Về Tools - Thực Hiện Hành Động Trong MCP

## Định Nghĩa Cốt Lõi

Tools trong MCP là các functions cho phép thực hiện hành động hoặc tác vụ có thể gây tác dụng phụ (side effects) như tạo, cập nhật hoặc xóa dữ liệu. Tools hoạt động theo nguyên tắc "model-controlled" - nghĩa là mô hình AI chủ động xác định khi nào và cách thức gọi tool.

## Cách Triển Khai Với TypeScript SDK

Theo tài liệu chính thức từ repository ModelContextProtocol TypeScript SDK, tools được triển khai qua phương thức `server.tool()`:

```typescript
import { z } from "zod";

server.tool(
  "createIssue", 
  z.object({ 
    projectKey: z.string().describe('Project key where issue will be created'),
    summary: z.string().describe('Issue title/summary'),
    description: z.string().optional().describe('Detailed description'),
    issueType: z.string().default("Task").describe('Type of issue')
  }), 
  async (params, context) => {
    // Implement logic to create an issue
    return { 
      content: [{ 
        type: "text", 
        text: `Issue ${newIssue.key} created successfully` 
      }]
    };
  }
);
```

SDK cũng hỗ trợ truy cập context cho các tool handlers:

```typescript
server.tool("getJiraIssue", schema, async (params, context) => {
  const config = context.get("atlassianConfig");
  // Use config to authenticate and make API calls
});
```

## Use Cases Với Atlassian

Tích hợp Tools với Jira:
- **Tạo issue mới** (`createIssue`)
- **Cập nhật issue** (`updateIssue`)
- **Chuyển trạng thái issue** (`transitionIssue`)
- **Gán issue cho người dùng** (`assignIssue`)
- **Thêm comment vào issue** (`addComment`)
- **Log thời gian làm việc** (`logWork`)

Tích hợp Tools với Confluence:
- **Tạo trang mới** (`createPage`)
- **Cập nhật nội dung trang** (`updatePage`)
- **Thêm comment vào trang** (`addComment`)
- **Tạo blog post** (`createBlogPost`)
- **Quản lý không gian làm việc** (`createSpace`, `archiveSpace`)

## So Sánh Với Resources & Prompts

| Khía Cạnh | Tools | Resources | Prompts |
|-----------|-------|-----------|---------|
| **Mô hình kiểm soát** | Model-controlled | Application-controlled | Template-oriented |
| **Hoạt động chính** | CREATE/UPDATE/DELETE | READ | FORMAT/TEMPLATE |
| **Tác dụng phụ** | Có | Không | Không |
| **Cần xác nhận người dùng** | Thường cần | Thường không cần | Không cần |
| **Tương tự REST** | POST/PUT/DELETE | GET | N/A |
| **Kiểu dữ liệu trả về** | `{ content: [...] }` | `{ contents: [...] }` | `{ messages: [...] }` |
| **Định nghĩa tham số** | Zod schema | ResourceTemplate | Zod schema |
| **Discovery method** | `listTools()` | `listResources()` | `listPrompts()` |

## Ưu Điểm Của Tools

1. **Mạnh Mẽ Trong Thực Hiện Tác Vụ**: Cho phép AI thực hiện các hành động thực tế, không chỉ truy vấn
2. **Validation Mạnh Mẽ Với Zod**: Đảm bảo tham số đầu vào đúng định dạng và giá trị
3. **Kiểm Soát Bởi Model**: Mô hình AI có thể chủ động quyết định sử dụng tool khi phù hợp
4. **Xử Lý Tương Tác Phức Tạp**: Thích hợp cho các tác vụ cần nhiều bước và thay đổi trạng thái

## Hạn Chế Của Tools

1. **Yêu Cầu Xác Nhận Của Người Dùng**: MCP clients thường yêu cầu phê duyệt trước khi thực hiện
2. **Quyền Truy Cập Cao Hơn**: Thường cần quyền ghi/sửa/xóa trên hệ thống
3. **Cần Xử Lý Lỗi Cẩn Thận**: Lỗi khi thực hiện hành động có thể gây hậu quả nghiêm trọng hơn
4. **Không Tối Ưu Cho Truy Vấn Đơn Giản**: Sử dụng tool chỉ để đọc dữ liệu sẽ kém hiệu quả hơn resources

## Best Practices Theo Tài Liệu Chính Thức

1. **Mô Tả Rõ Ràng Cho Schema**: Sử dụng `.describe()` để giải thích mục đích của từng tham số
2. **Xử Lý Lỗi Nghiêm Túc**: Bắt và xử lý tất cả exceptions, trả về thông báo lỗi có ý nghĩa
3. **Tuân Thủ Định Dạng Trả Về**: Luôn trả về dạng `{ content: [{ type: "text", text: "..." }] }`
4. **Đặt Tên Tool Rõ Ràng**: Sử dụng tên hành động có ý nghĩa (ví dụ: `createIssue` thay vì `makeIssue`)
5. **Thiết Kế API Nhất Quán**: Duy trì cấu trúc tham số và phản hồi nhất quán giữa các tools
6. **Lưu Logs Đầy Đủ**: Ghi lại mọi hành động tool thực hiện để debug và kiểm toán

## Ví Dụ Tương Tác Thực Tế

```
User: "Tạo issue mới cho bug màn hình đăng nhập bị treo"

AI: "Tôi có thể giúp tạo issue mới cho bug này. Vui lòng cung cấp thêm thông tin:
- Project key nào bạn muốn tạo issue?
- Có thông tin chi tiết nào thêm về lỗi không?"

User: "Project DEV, xảy ra khi người dùng nhập sai mật khẩu 3 lần"

AI: "Tôi sẽ tạo issue trong project DEV với các chi tiết sau:

- Summary: 'Login screen freezes after 3 failed password attempts'
- Description: 'When a user enters incorrect password 3 times, the login screen becomes unresponsive and requires page refresh.'
- Issue Type: Bug

Bạn có muốn tôi tạo issue này không?"

[Show confirmation dialog in MCP client]

User: [Confirms]

AI: "Issue đã được tạo thành công:
- Key: DEV-423
- Status: To Do
- Assignee: Unassigned
- Link: https://your-domain.atlassian.net/browse/DEV-423

Bạn có muốn gán issue này cho ai đó không?"