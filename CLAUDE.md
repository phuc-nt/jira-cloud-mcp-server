## PHẦN 1: QUY TẮC CHUNG (Reusable across projects)

### Quy tắc cơ bản

- **Luôn sử dụng tiếng Việt để trả lời** trừ khi user yêu cầu tiếng Anh cụ thể
- Đọc project documentation trước khi bắt đầu bất kỳ task nào
- Tuân thủ workflow đã được định nghĩa trong project

### Git Commit Guidelines

- **Không sử dụng emoji** trong commit messages
- **Không thêm thông tin về Claude Code** hoặc AI tools trong commit message
- Sử dụng conventional commit format: `type: description`
- Ví dụ: `feat: add user authentication`, `fix: resolve memory leak in chat view`

### 🤖 Serena MCP Integration

#### Kiểm tra Setup Serena

**Đầu tiên cần kiểm tra xem đã setup Serena cho project chưa:**
- Kiểm tra file `.serena/cache/` có tồn tại trong project không
- Chạy lệnh để xem Serena tools có khả dụng không

**Nếu chưa setup Serena cho project, cần thực hiện setup:**

#### Setup Serena cho Project Mới

1. **Cài đặt Serena cho project:**
```bash
claude mcp add serena -- uvx --from git+https://github.com/oraios/serena serena-mcp-server --context ide-assistant --project $(pwd)
```

2. **Lập chỉ mục cho codebase:**
```bash
uvx --from git+https://github.com/oraios/serena index-project
```
⚠️ **Quan trọng:** Quá trình này sẽ tốn vài phút tùy vào kích thước project

3. **Kích hoạt Serena trong Claude Code:**
Chạy prompt: `read Serena's initial instructions`

#### Yêu cầu Sau Setup

```yaml
Setup Requirements:
  - Serena đã được cài đặt cho project này
  - Codebase đã được indexed với "uvx --from git+https://github.com/oraios/serena index-project"
  - Cache được lưu tại .serena/cache/

Session Activation:
  - BẮT BUỘC: Chạy "read Serena's initial instructions" mỗi session mới
  - Serena cung cấp semantic search và code analysis tools
  - Giúp tìm kiếm code theo ngữ nghĩa thay vì chỉ keyword matching

```

#### Lưu ý Quan trọng
- **Cài đặt theo từng project:** Serena cần được setup riêng cho mỗi project
- **Không cần cài lại uv:** Chỉ cần thực hiện 3 bước setup trên
- **Bảo mật và hiệu quả:** Mỗi project có index riêng biệt để tránh nhập nhằng dữ liệu
