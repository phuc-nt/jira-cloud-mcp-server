# Hướng Dẫn Đăng MCP Atlassian Server Lên Marketplace Cline

Đây là hướng dẫn chuẩn để bạn đưa MCP Atlassian Server (Jira/Confluence) lên Marketplace của Cline, giúp cộng đồng có thể cài đặt và sử dụng chỉ với một nhấp chuột.

---

## 1. Chuẩn Bị Repository

- **Repository phải công khai trên GitHub**.
- **README.md** cần đầy đủ các mục: Giới thiệu, Yêu cầu hệ thống, Hướng dẫn cài đặt nhanh (Quick Start), Hướng dẫn cấu hình, và ví dụ sử dụng.
- **Nên có file `llms-install.md`**: Hướng dẫn cài đặt chi tiết dành cho AI (tham khảo mẫu bên dưới).

---

## 2. Tạo Issue Đăng Ký Lên Marketplace

1. Truy cập [Cline MCP Marketplace Repository](https://github.com/cline/mcp-marketplace)
2. Tạo issue mới với tiêu đề: `[Server Submission]: MCP Atlassian Server`
3. Nội dung issue cần có:
   - **GitHub Repo URL**: Link repository của bạn
   - **Logo Image**: PNG 400×400 (icon server, nếu có)
   - **Reason for Addition**: Mô tả ngắn về lợi ích server này (ví dụ: "Kết nối AI với Jira/Confluence, tối ưu cho local dev, hỗ trợ resource & tool chuẩn MCP")

---

## 3. Xác Nhận Khả Năng Cài Đặt Tự Động

- Đảm bảo Cline có thể cài đặt server chỉ dựa vào README.md và/hoặc llms-install.md
- Server phải chạy ổn định, có thể test với Cline local (khuyến nghị test cả Docker và Node.js local)

---

## 4. Tối Ưu Hóa Cho Cài Đặt Một Nhấp Chuột

### a. README.md cần có:
- **Quick Start**: Các lệnh cài đặt, build, chạy server rõ ràng, từng bước một.
- **Cấu hình .env**: Hướng dẫn tạo file `.env` với các biến:
  ```
  ATLASSIAN_SITE_NAME=your-site.atlassian.net
  ATLASSIAN_USER_EMAIL=your-email@example.com
  ATLASSIAN_API_TOKEN=your-api-token
  ```
- **Ví dụ cấu hình Cline** (cho cả Docker và Node.js local):
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
  (Thay `/đường/dẫn/tới/` bằng đường dẫn thực tế)

### b. Tạo file `llms-install.md` (khuyến nghị)

Ví dụ nội dung:
```markdown
# Hướng Dẫn Cài Đặt MCP Atlassian Server Cho AI

## Yêu Cầu
- Node.js 16+ hoặc Docker
- Tài khoản Atlassian Cloud và API token

## Bước 1: Clone Repository
```bash
git clone https://github.com/yourusername/mcp-atlassian-server.git
cd mcp-atlassian-server
```

## Bước 2: Cài Đặt Dependencies
```bash
npm install
```

## Bước 3: Build Project
```bash
npm run build
```

## Bước 4: Tạo file .env
```env
ATLASSIAN_SITE_NAME=your-site.atlassian.net
ATLASSIAN_USER_EMAIL=your-email@example.com
ATLASSIAN_API_TOKEN=your-api-token
```

## Bước 5: Chạy Server
```bash
npm start
```

## Bước 6: Cấu Hình Cline
Thêm cấu hình sau vào file `cline_mcp_settings.json`:
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
```

---

## 5. Chờ Phê Duyệt

Sau khi tạo issue, đội ngũ Cline sẽ kiểm tra:
- Khả năng cài đặt tự động
- Tính ổn định, bảo mật
- Giá trị thực tế cho cộng đồng

Khi được duyệt, MCP Server của bạn sẽ xuất hiện trên Marketplace và có thể cài đặt tự động qua Cline.

---

## Lưu Ý Thực Tế
- Đảm bảo server hoạt động ổn định, test kỹ với Cline local
- Hướng dẫn rõ cách lấy Atlassian API token (có thể bổ sung link hướng dẫn trong README)
- Xử lý lỗi thân thiện, log rõ ràng để AI và user dễ debug
- Cập nhật README.md khi có thay đổi về API hoặc cấu trúc
- Ưu tiên local-first, không yêu cầu cloud nếu không cần thiết

---

**Bạn đã sẵn sàng submit MCP Atlassian Server lên Marketplace Cline!**