# Hướng Dẫn Bổ Sung Resource và Tool cho Confluence API v2

Dựa trên tài liệu API v2 của Confluence, dưới đây là hướng dẫn bổ sung các resource và tool mới cho MCP server của bạn.

## Bổ Sung Resource

### 1. Blog Posts

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Blog Posts | `confluence://blogposts` | Danh sách bài viết blog | `/wiki/api/v2/blogposts` | Array của BlogPost objects |
| Blog Post Details | `confluence://blogposts/{blogpostId}` | Chi tiết bài viết blog | `/wiki/api/v2/blogposts/{blogpostId}` | Single BlogPost object |
| Blog Post Labels | `confluence://blogposts/{blogpostId}/labels` | Nhãn của bài viết blog | `/wiki/api/v2/blogposts/{blogpostId}/labels` | Array của Label objects |
| Blog Post Versions | `confluence://blogposts/{blogpostId}/versions` | Lịch sử phiên bản | `/wiki/api/v2/blogposts/{blogpostId}/versions` | Array của Version objects |

### 2. Comments

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Page Comments | `confluence://pages/{pageId}/comments` | Danh sách bình luận của trang | `/wiki/api/v2/pages/{pageId}/comments` | Array của Comment objects |
| Blog Comments | `confluence://blogposts/{blogpostId}/comments` | Danh sách bình luận của blog | `/wiki/api/v2/blogposts/{blogpostId}/comments` | Array của Comment objects |
| Comment Details | `confluence://comments/{commentId}` | Chi tiết bình luận | `/wiki/api/v2/comments/{commentId}` | Single Comment object |

### 3. Watchers

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Page Watchers | `confluence://pages/{pageId}/watchers` | Người theo dõi trang | `/wiki/api/v2/pages/{pageId}/watchers` | Array của Watcher objects |
| Space Watchers | `confluence://spaces/{spaceId}/watchers` | Người theo dõi không gian | `/wiki/api/v2/spaces/{spaceId}/watchers` | Array của Watcher objects |
| Blog Watchers | `confluence://blogposts/{blogpostId}/watchers` | Người theo dõi blog | `/wiki/api/v2/blogposts/{blogpostId}/watchers` | Array của Watcher objects |

### 4. Custom Content

| Resource | URI | Mô tả | Atlassian API Endpoint | Dữ liệu trả về |
|----------|-----|-------|-----------------------|----------------|
| Custom Content | `confluence://custom-content` | Danh sách nội dung tùy chỉnh | `/wiki/api/v2/custom-content` | Array của CustomContent objects |
| Custom Content Details | `confluence://custom-content/{customContentId}` | Chi tiết nội dung tùy chỉnh | `/wiki/api/v2/custom-content/{customContentId}` | Single CustomContent object |

## Bổ Sung Tool

### 1. Quản lý trang

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| deletePage | Xóa trang | pageId | `/wiki/api/v2/pages/{id}` (DELETE) | Status của xóa |
| publishDraft | Xuất bản bản nháp | pageId | `/wiki/api/v2/pages/{id}` (PUT với status=current) | Page đã xuất bản |
| watchPage | Theo dõi trang | pageId, userId | `/wiki/api/v2/pages/{id}/watchers` (POST) | Status của theo dõi |
| unwatchPage | Hủy theo dõi trang | pageId, userId | `/wiki/api/v2/pages/{id}/watchers/{userId}` (DELETE) | Status của hủy theo dõi |

### 2. Quản lý Blog Post

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createBlogPost | Tạo bài viết blog | spaceId, title, content | `/wiki/api/v2/blogposts` (POST) | BlogPost ID mới |
| updateBlogPost | Cập nhật bài viết blog | blogpostId, title, content, version | `/wiki/api/v2/blogposts/{id}` (PUT) | Status của update |
| deleteBlogPost | Xóa bài viết blog | blogpostId | `/wiki/api/v2/blogposts/{id}` (DELETE) | Status của xóa |
| watchBlogPost | Theo dõi bài viết blog | blogpostId, userId | `/wiki/api/v2/blogposts/{id}/watchers` (POST) | Status của theo dõi |

### 3. Quản lý Comment

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| updateComment | Cập nhật bình luận | commentId, content, version | `/wiki/api/v2/comments/{id}` (PUT) | Status của update |
| deleteComment | Xóa bình luận | commentId | `/wiki/api/v2/comments/{id}` (DELETE) | Status của xóa |

### 4. Quản lý Attachment

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| uploadAttachment | Tải lên tệp đính kèm | pageId, file, comment | `/wiki/api/v2/pages/{id}/attachments` (POST) | Attachment ID mới |
| updateAttachment | Cập nhật tệp đính kèm | pageId, attachmentId, file, comment | `/wiki/api/v2/attachments/{id}` (PUT) | Status của update |
| deleteAttachment | Xóa tệp đính kèm | attachmentId | `/wiki/api/v2/attachments/{id}` (DELETE) | Status của xóa |

### 5. Quản lý Space

| Tool | Mô tả | Tham số chính | Atlassian API Endpoint | Dữ liệu output |
|------|-------|---------------|-----------------------|----------------|
| createSpace | Tạo không gian | name, key, description | `/wiki/api/v2/spaces` (POST) | Space ID mới |
| updateSpace | Cập nhật không gian | spaceId, name, description | `/wiki/api/v2/spaces/{id}` (PUT) | Status của update |
| watchSpace | Theo dõi không gian | spaceId, userId | `/wiki/api/v2/spaces/{id}/watchers` (POST) | Status của theo dõi |
| unwatchSpace | Hủy theo dõi không gian | spaceId, userId | `/wiki/api/v2/spaces/{id}/watchers/{userId}` (DELETE) | Status của hủy theo dõi |

## Lưu ý quan trọng về API v2

1. **Phân trang cursor-based**: API v2 sử dụng cursor-based pagination thay vì offset-based. Các tham số phân trang là `limit` và `cursor` thay vì `limit` và `start`.

2. **Cấu trúc request/response**:
   - Request body cho các thao tác tạo/cập nhật trang có cấu trúc khác với API v1
   - Ví dụ tạo trang:
     ```
     {
       "spaceId": "string",
       "status": "current",
       "title": "string",
       "parentId": "string",
       "body": {
         "representation": "storage",
         "value": "string"
       }
     }
     ```

3. **Định dạng nội dung**: API v2 hỗ trợ nhiều định dạng nội dung (representation) như `storage`, `atlas_doc_format`, v.v. Cần chỉ định rõ trong request.

4. **Quản lý phiên bản**: Khi cập nhật trang, cần cung cấp số phiên bản hiện tại trong trường `version.number`.

5. **Quyền hạn**: Mỗi endpoint yêu cầu quyền hạn cụ thể, ví dụ:
   - Tạo trang: Quyền xem không gian tương ứng và quyền tạo trang trong không gian đó
   - Xóa trang: Quyền xem trang, không gian tương ứng và quyền xóa trang

6. **Thời gian hết hạn**: API v1 sẽ bị loại bỏ, nên việc chuyển đổi sang API v2 là cần thiết.

7. **Scope cho Connect app**: Các endpoint yêu cầu scope cụ thể, ví dụ:
   - Đọc trang: `READ`
   - Ghi trang: `WRITE`

Với các thông tin này, bạn có thể mở rộng MCP server để hỗ trợ đầy đủ các tính năng của Confluence API v2, giúp người dùng tương tác hiệu quả hơn với Confluence thông qua AI.