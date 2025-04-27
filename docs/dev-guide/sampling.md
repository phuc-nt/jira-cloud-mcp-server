# Chi Tiết Về Sampling - Đảo Ngược Mối Quan Hệ Client-Server Trong MCP

## Định Nghĩa Cốt Lõi

Sampling trong MCP là một tính năng đặc biệt cho phép đảo ngược mối quan hệ client-server truyền thống. Thay vì client gửi yêu cầu đến server, Sampling cho phép MCP server yêu cầu mô hình AI (LLM) từ client tạo ra các hoàn thành (completions). Sampling hoạt động theo nguyên tắc "server-requested" - nghĩa là server đề xuất nhu cầu, nhưng client vẫn giữ quyền kiểm soát cuối cùng.

## Cách Triển Khai Với TypeScript SDK

Theo tài liệu chính thức từ GitHub, Sampling được triển khai thông qua `exchange.createMessage()`:

```typescript
// Trong một tool handler hoặc logic server
async function someToolHandler(input: any, exchange: McpServerExchange) {
  // Kiểm tra xem client có hỗ trợ sampling không
  if (!exchange.clientCapabilities?.sampling) {
    return {
      content: [{ type: "text", text: "Client không hỗ trợ sampling." }],
      isError: true,
    };
  }

  try {
    // Tạo yêu cầu sampling gửi đến client
    const samplingRequest: McpSchema.CreateMessageRequest = {
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: `Phân tích dữ liệu này: ${JSON.stringify(input)}`,
          },
        },
      ],
      modelPreferences: {
        intelligencePriority: 0.7,
        hints: [{ name: "claude-3-opus" }]
      },
      maxTokens: 500,
    };

    // Gửi yêu cầu ĐẾN client
    const samplingResult = await exchange.createMessage(samplingRequest);

    // Xử lý phản hồi từ LLM
    return {
      content: [
        { type: "text", text: `Phân tích hoàn tất: ${samplingResult.content.text}` },
      ],
    };
  } catch (error: any) {
    return {
      content: [{ type: "text", text: `Lỗi khi phân tích: ${error.message}` }],
      isError: true,
    };
  }
}
```

## Use Cases Với Atlassian

Sampling mở ra các khả năng mới khi tích hợp với Atlassian:
- **Tự động tạo descriptions cho issues**: Server lấy context từ code/PR và yêu cầu LLM tạo mô tả
- **Tạo commit messages thông minh**: Phân tích diff và đề xuất commit message
- **Tóm tắt nội dung phức tạp**: Tóm tắt trang Confluence dài thành điểm chính
- **Phân tích comments và feedback**: Hiểu và tổng hợp feedback từ nhiều người dùng
- **Tự động tạo release notes**: Phân tích các issues đã giải quyết và tạo release notes

## So Sánh Với Tools, Resources & Prompts

| Khía Cạnh | Sampling | Tools | Resources | Prompts |
|-----------|----------|-------|-----------|---------|
| **Mô hình kiểm soát** | Server-requested, Client-controlled | Model-controlled | Application-controlled | Template-oriented |
| **Hướng dữ liệu** | Server → Client → Server | Client → Server | Client → Server | Server → Client |
| **Hoạt động chính** | GENERATE | CREATE/UPDATE/DELETE | READ | FORMAT/TEMPLATE |
| **Tác dụng phụ** | Không trực tiếp | Có | Không | Không |
| **Sự phụ thuộc** | Phụ thuộc vào client có LLM | Độc lập | Độc lập | Độc lập |
| **Khả năng tạo nội dung** | Cao (động) | Thấp (cố định) | Không | Trung bình (template) |
| **Capability check** | `clientCapabilities.sampling` | N/A | N/A | N/A |

## Ưu Điểm Của Sampling

1. **Client Kiểm Soát Mô Hình**: Client quyết định mô hình, hosting, quyền riêng tư và chi phí
2. **Tích Hợp Trí Tuệ Vào Server**: Server có thể sử dụng khả năng AI mà không cần tích hợp mô hình
3. **Linh Hoạt Trong Sinh Nội Dung**: Cho phép sinh nội dung động, phù hợp với ngữ cảnh
4. **Cá Nhân Hóa Cao**: Tận dụng mô hình mà client đã sử dụng và quen thuộc
5. **An Toàn Và Riêng Tư**: Dữ liệu nhạy cảm không cần rời khỏi hệ thống client/server

## Hạn Chế Của Sampling

1. **Phụ Thuộc Vào Khả Năng Client**: Chỉ hoạt động nếu client hỗ trợ sampling
2. **Kiểm Soát Hạn Chế**: Server không thể đảm bảo kết quả cụ thể từ LLM
3. **Độ Trễ Cao Hơn**: Thêm một vòng giao tiếp client-server
4. **Chi Phí Cho Client**: Client phải chịu chi phí API của LLM

## Best Practices Theo Tài Liệu Chính Thức

1. **Luôn Kiểm Tra Capability**: Kiểm tra `exchange.clientCapabilities?.sampling` trước khi gọi
2. **Cung Cấp Ngữ Cảnh Đầy Đủ**: Đảm bảo messages có đủ thông tin cho LLM
3. **Xử Lý Lỗi Kỹ Lưỡng**: Luôn có plan B khi sampling thất bại
4. **Sử Dụng ModelPreferences**: Gợi ý mô hình phù hợp thay vì yêu cầu cụ thể
5. **Tối Ưu Context**: Chuẩn bị ngữ cảnh có cấu trúc để giảm token và tăng chất lượng

## Ví Dụ Tương Tác Thực Tế

```
User: "Tóm tắt các PR đã merge trong sprint này"

AI: "Tôi sẽ tìm các PR đã merge..."

[AI sử dụng Resource jira://sprints/current/pull-requests để lấy danh sách PR]

Sau đó, Server gửi yêu cầu Sampling đến Client:

Server → Client: "Hãy tóm tắt các PR sau thành một nhóm các thay đổi có liên quan:
PR-123: Fix login button alignment
PR-124: Update authentication flow
PR-125: Add remember me checkbox
PR-126: Fix typo in registration page
..."

[Client xử lý yêu cầu bằng LLM và trả về kết quả]

Client → Server: "Các PR trong sprint này chủ yếu tập trung vào cải thiện hệ thống xác thực:
1. Nâng cấp UI đăng nhập (PR-123, PR-125)
2. Cải thiện quy trình xác thực (PR-124)
3. Sửa lỗi nhỏ trong trang đăng ký (PR-126)
..."

AI: "Tôi đã phân tích các PR đã merge trong sprint này. Các thay đổi chính tập trung vào hệ thống xác thực, bao gồm:
1. Nâng cấp UI đăng nhập với việc điều chỉnh nút đăng nhập và thêm tùy chọn 'remember me'
2. Cải thiện luồng xác thực
3. Sửa các lỗi nhỏ trong trang đăng ký
..."
```

## Mối Liên Hệ Với Các Capabilities Khác

Sampling bổ sung cho các capabilities khác trong MCP, tạo nên một hệ sinh thái hoàn chỉnh:

- **Tools** thực hiện hành động cụ thể, thay đổi dữ liệu
- **Resources** truy xuất và cung cấp dữ liệu có cấu trúc
- **Prompts** định hình cách thức giao tiếp qua templates
- **Sampling** cho phép server khai thác "trí tuệ" từ LLM của client

Trong nhiều kịch bản, một quy trình hoàn chỉnh có thể kết hợp tất cả các capabilities:
1. Sử dụng **Resources** để lấy dữ liệu
2. Sử dụng **Sampling** để phân tích và tạo nội dung thông minh
3. Sử dụng **Prompts** để định dạng kết quả phù hợp
4. Sử dụng **Tools** để thực hiện các hành động dựa trên phân tích

Sampling đại diện cho một bước tiến đáng kể trong MCP, cho phép tạo ra các server thông minh mà không cần tích hợp mô hình AI trực tiếp, đồng thời vẫn tôn trọng quyền kiểm soát của client. 