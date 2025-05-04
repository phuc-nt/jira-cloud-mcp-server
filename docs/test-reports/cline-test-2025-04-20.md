# BẢN TEST REPORT MCP SERVER ATLASSIAN (JIRA/CONFLUENCE)

## I. RESOURCE

### jira://issues/XDEMO2-43
- **Request**: Lấy chi tiết issue với key = XDEMO2-43
- **Response**: Trả về thông tin chi tiết issue (summary, status, assignee, reporter, description, url)
- **Ghi chú**: Thành công

### jira://issues
- **Request**: Lấy danh sách issue
- **Response**: Trả về danh sách 20 issue đầu tiên, tổng số issue, thông tin từng issue
- **Ghi chú**: Thành công

### jira://issues?jql=project=XDEMO2
- **Request**: Lấy danh sách issue theo JQL đơn giản (project=XDEMO2)
- **Response**: Trả về danh sách issue đúng với JQL
- **Ghi chú**: Thành công với JQL không có ký tự đặc biệt. Nếu JQL có dấu cách/ký tự đặc biệt (ví dụ: project = XDEMO2 AND key = XDEMO2-43) sẽ lỗi do ký tự % hoặc encode không đúng chuẩn. Workaround: chỉ dùng JQL đơn giản, không encode.

### jira://issues/XDEMO2-43/transitions
- **Request**: Lấy danh sách transition có thể thực hiện cho issue XDEMO2-43
- **Response**: Trả về danh sách transition (id, name, to, description)
- **Ghi chú**: Thành công

### jira://issues/XDEMO2-43/comments
- **Request**: Lấy danh sách comment của issue XDEMO2-43
- **Response**: Trả về danh sách comment (id, author, body, created, updated)
- **Ghi chú**: Thành công

### jira://projects/XDEMO2
- **Request**: Lấy chi tiết project XDEMO2
- **Response**: Trả về thông tin project (id, key, name, description, lead, url, projectType)
- **Ghi chú**: Thành công

### jira://projects/XDEMO2/roles
- **Request**: Lấy danh sách role trong project XDEMO2
- **Response**: Trả về danh sách role (roleName, roleId, url)
- **Ghi chú**: Thành công

### jira://users/assignable/XDEMO2
- **Request**: Lấy danh sách user có thể được gán issue trong project XDEMO2
- **Response**: Trả về danh sách user (accountId, displayName, email, active, avatarUrl)
- **Ghi chú**: Thành công

### jira://users/557058:24acce7b-a0c1-4f45-97f1-7eb4afd2ff5f
- **Request**: Lấy chi tiết user theo accountId
- **Response**: Trả về thông tin user (accountId, displayName, email, active, avatarUrl, timeZone, locale)
- **Ghi chú**: Thành công

### jira://users/role/XDEMO2/10002
- **Request**: Lấy danh sách user thuộc role Administrators (roleId=10002) của project XDEMO2
- **Response**: Trả về danh sách user (trường hợp này rỗng)
- **Ghi chú**: Thành công

## II. TOOL

### createIssue
- **Request**: 
  - a) Đầy đủ trường (projectKey, summary, issueType, description, priority, assignee, labels): Lỗi "Dữ liệu issue không hợp lệ" 
  - b) Chỉ truyền projectKey, summary: Thành công, trả về key issue mới (XDEMO2-49)
- **Ghi chú**: Chỉ cần truyền trường tối thiểu, các trường khác có thể không hợp lệ với cấu hình project.

### updateIssue
- **Request**: Cập nhật summary, description cho issue XDEMO2-43
- **Response**: Thành công, issue được cập nhật
- **Ghi chú**: Thành công

### transitionIssue
- **Request**: Chuyển trạng thái issue XDEMO2-43 sang "To Do" (transitionId=51), có comment
- **Response**: Thành công, issue được chuyển trạng thái
- **Ghi chú**: Thành công

### assignIssue
- **Request**: Gán issue XDEMO2-43 cho user LemmyC (accountId=62e8c6c8c1b3a10ac3a9c03f)
- **Response**: Thành công, issue được gán cho user
- **Ghi chú**: Thành công

### createPage
- **Request**: 
  - a) Truyền content dạng HTML phức tạp, có parentId: Lỗi "Yêu cầu không hợp lệ" 
  - b) Truyền content storage format, có parentId: Lỗi "Yêu cầu không hợp lệ" 
  - c) Truyền content HTML đơn giản ("Test page"), không parentId: Thành công, trả về URL trang mới
- **Ghi chú**: Chỉ nên truyền content HTML đơn giản, không truyền parentId. Nếu truyền content phức tạp hoặc parentId có thể bị lỗi.

### addComment
- **Request**: Thêm comment vào pageId=11206678, content HTML đơn giản
- **Response**: Thành công, trả về ID comment mới
- **Ghi chú**: Thành công

## III. NHẬN XÉT & CHÚ Ý

1. Resource JQL chỉ hoạt động với truy vấn đơn giản, không có ký tự đặc biệt hoặc encode. Nếu cần truy vấn phức tạp, cần kiểm tra lại cách encode hoặc cấu hình server.
2. Tool createPage chỉ hoạt động với content HTML đơn giản, không truyền parentId. Nếu truyền content phức tạp hoặc parentId có thể bị lỗi "Yêu cầu không hợp lệ".
3. Các resource và tool còn lại hoạt động ổn định, trả về dữ liệu đúng với tham số test.
4. Khi gặp lỗi, nên thử tối giản tham số truyền vào, kiểm tra lại format dữ liệu và quyền truy cập.

Bản test report này tổng hợp đầy đủ các trường hợp đã kiểm thử, kết quả và các lưu ý đặc biệt cho từng resource/tool của MCP server atlassian hiện tại. 