# Hướng dẫn chuyển đổi từ Jira API v2 sang v3

Dựa vào tài liệu chính thức của Atlassian, việc chuyển từ API v2 sang v3 cho các resource Jira chủ yếu liên quan đến việc hỗ trợ Atlassian Document Format (ADF) cho các trường rich text. Dưới đây là hướng dẫn chi tiết:

## Lý do chuyển đổi
- API v3 là phiên bản mới nhất và được Atlassian khuyến nghị sử dụng
- Hỗ trợ Atlassian Document Format (ADF) cho các trường rich text
- Cấu trúc API nhất quán hơn
- Sẽ được hỗ trợ lâu dài hơn v2

## Các bước chuyển đổi

### 1. Thay đổi endpoint URL
Đơn giản nhất là thay đổi `/rest/api/2/` thành `/rest/api/3/` trong tất cả các endpoint:

```javascript
// Thay thế
const baseUrl = '/rest/api/2/';
// Thành
const baseUrl = '/rest/api/3/';
```

### 2. Cập nhật xử lý dữ liệu cho các trường rich text

Các trường rich text như `description`, `comment`, và `environment` trong v3 sẽ trả về dạng ADF thay vì text thuần. Bạn cần cập nhật code để xử lý định dạng này:

```javascript
// Ví dụ v2 (text thuần)
const description = issue.fields.description; // "This is a description"

// Ví dụ v3 (ADF format)
const description = issue.fields.description; 
/* {
  "type": "doc",
  "version": 1,
  "content": [
    {
      "type": "paragraph",
      "content": [
        {
          "type": "text",
          "text": "This is a description"
        }
      ]
    }
  ]
} */
```

### 3. Cập nhật từng endpoint cụ thể

| Resource | Endpoint cũ | Endpoint mới | Lưu ý thay đổi |
|----------|------------|--------------|----------------|
| Issues | `/rest/api/2/search` | `/rest/api/3/search` | Trường description, comment sẽ trả về dạng ADF |
| Issue Details | `/rest/api/2/issue/{issueKey}` | `/rest/api/3/issue/{issueKey}` | Trường description, environment, comment sẽ trả về dạng ADF |
| Issue Transitions | `/rest/api/2/issue/{issueKey}/transitions` | `/rest/api/3/issue/{issueKey}/transitions` | Không có thay đổi lớn về cấu trúc |
| Issue Comments | `/rest/api/2/issue/{issueKey}/comment` | `/rest/api/3/issue/{issueKey}/comment` | Comment body sẽ trả về dạng ADF |
| Projects | `/rest/api/2/project` | `/rest/api/3/project` | Không có thay đổi lớn về cấu trúc |
| Project Details | `/rest/api/2/project/{projectKey}` | `/rest/api/3/project/{projectKey}` | Không có thay đổi lớn về cấu trúc |
| User Details | `/rest/api/2/user?accountId=...` | `/rest/api/3/user?accountId=...` | Không có thay đổi lớn về cấu trúc |

### 4. Xử lý ADF trong code

Để xử lý ADF, bạn có thể:

1. Hiển thị trực tiếp nếu client hỗ trợ ADF
2. Chuyển đổi ADF sang HTML hoặc text thuần để hiển thị:

```javascript
// Hàm đơn giản để trích xuất text từ ADF
function extractTextFromADF(adf) {
  if (!adf || typeof adf === 'string') return adf;
  
  let text = '';
  if (adf.content) {
    adf.content.forEach(node => {
      if (node.type === 'paragraph' && node.content) {
        node.content.forEach(inline => {
          if (inline.type === 'text') {
            text += inline.text;
          }
        });
        text += '\n';
      }
    });
  }
  return text;
}
```

### 5. Cập nhật schema và metadata

Khi chuẩn hóa metadata và schema, hãy cập nhật để phản ánh cấu trúc ADF:

```javascript
const issueSchema = {
  type: "object",
  properties: {
    // ...
    description: {
      type: "object",
      properties: {
        type: { type: "string", enum: ["doc"] },
        version: { type: "number" },
        content: { type: "array" }
      },
      description: "Issue description in ADF format"
    }
    // ...
  }
};
```

## Lưu ý quan trọng

1. **Tương thích ngược**: API v3 vẫn duy trì tương thích với hầu hết các endpoint v2, nhưng định dạng dữ liệu cho các trường rich text đã thay đổi.

2. **Xử lý ADF**: Cần cập nhật code để xử lý ADF cho các trường như description, comment, environment, và custom field dạng textarea.

3. **Kiểm tra kỹ**: Sau khi chuyển đổi, kiểm tra kỹ tất cả các endpoint để đảm bảo chúng hoạt động như mong đợi.

4. **Tài liệu API**: Tham khảo tài liệu API v3 tại https://developer.atlassian.com/cloud/jira/platform/rest/v3/intro/ để biết thêm chi tiết.

Việc chuyển đổi này sẽ giúp MCP server của bạn hiện đại hơn và tương thích tốt hơn với các tính năng mới của Jira Cloud.
