# TODO MCP Atlassian Server – Ưu tiên kiểm thử & fix bug Jira resource/tool

Tài liệu này liệt kê các task quan trọng cần thực hiện ngay để đảm bảo các resource và tool Jira hoạt động ổn định, đúng chuẩn MCP, tương thích tốt với Cline.

## Tổng kết refactor & chuẩn hóa (đã hoàn thành)
- Đã refactor toàn bộ file lớn `atlassian-api.ts` thành các module nhỏ: base helper, resource API, tool API riêng biệt cho Jira/Confluence.
- Đã tách module Jira tools theo endpoint (`/rest/api/3` và `/rest/agile/1.0`).
- Đã cập nhật tài liệu hướng dẫn maintain/extend resource/tool sau refactor (xem [docs/introduction/resources-and-tools.md](../docs/introduction/resources-and-tools.md)).

## [Mục tiêu tháng 7/2025] Test & Fix toàn diện Jira Tools/Resources

- [x] Test toàn bộ resource Jira (Dashboards, Boards, Sprints, Backlog, Gadgets...) — Đã test thực tế với project XDEMO2, tất cả resource chính hoạt động tốt:
    1. Project: Lấy thông tin chi tiết project XDEMO2 thành công.
    2. Roles: Lấy danh sách roles của project.
    3. Users Assignable: Lấy danh sách user có thể assign cho project.
    4. Issues: Lấy danh sách issues thuộc project, truy xuất chi tiết issue, transitions, comments.
    5. Boards: Lấy danh sách board, xác nhận board Kanban và Scrum của XDEMO2.
    6. Sprints: Lấy danh sách sprint của board Scrum (chưa có sprint nào, resource vẫn hoạt động).
    7. Issues trên board: Lấy danh sách issues trên board Kanban thành công.
    8. Filters: Lấy danh sách filter liên quan đến XDEMO2 thành công.
    9. Dashboards: Lấy danh sách dashboard thành công.
    > Tất cả các resource đều trả về dữ liệu hợp lệ, xác nhận khả năng truy xuất và tích hợp JIRA resource qua MCP server cho project XDEMO2 hoạt động đầy đủ.
- [ ] Test toàn bộ tool Jira (board, sprint, dashboard, gadget, backlog...)
  - [x] Tool issue (createIssue): Đã test và fix thành công
  - [x] Tool filter (createFilter, updateFilter, deleteFilter): Đã test và fix thành công
  - [x] Tool sprint (createSprint, startSprint, closeSprint): Đã test, hoạt động ổn định, closeSprint hỗ trợ completeDate chuẩn
  - [x] Tool board: Đã test thành công với addIssuesToBacklog, rankBacklogIssues 
  - [x] Tool dashboard/gadget: Đã test thành công toàn bộ quy trình thao tác với dashboard và gadget
    - Tạo/cập nhật dashboard
    - Lấy danh sách gadget khả dụng (resource jira://gadgets)
    - Thêm gadget vào dashboard (addGadgetToDashboard)
    - Lấy danh sách gadget trên dashboard (resource jira://dashboards/{dashboardId}/gadgets)
    - Xóa gadget khỏi dashboard (removeGadgetFromDashboard)
    - Đã sửa lỗi resource jira://dashboards/{dashboardId}/gadgets trả về danh sách rỗng (do dùng sai endpoint /gadgets thay vì /gadget)
- [ ] Ghi chú lại tất cả bug, edge case, behavior bất thường khi test thực tế với Cline
- [ ] Ưu tiên kiểm thử thực tế với Cline, so sánh kết quả với Atlassian UI
- [ ] Bổ sung test case minh hoạ cho từng resource/tool Jira (có thể chạy độc lập)
- [x] Fix bug, refactor code/tool nếu phát hiện lỗi hoặc chưa chuẩn hóa
- [x] Chuẩn hóa lại schema, metadata trả về cho đúng MCP/Cline
- [ ] Cập nhật lại tài liệu (README, resources-and-tools.md, roadmap) nếu có thay đổi lớn

### Hướng dẫn thực hiện
- Ghi chú bug, edge case, behavior lạ trực tiếp vào file này hoặc tạo issue trên GitHub.
- Sau mỗi lần fix/chuẩn hóa, cập nhật lại checklist và tài liệu liên quan.
- Ưu tiên test thực tế với Cline, kiểm tra cả UI và API response.
- Sau khi hoàn thành checklist, merge lại vào main và cập nhật roadmap tổng thể.

> **Tham khảo chi tiết:**
> - Hướng dẫn maintain/extend resource/tool: [docs/introduction/resources-and-tools.md](../docs/introduction/resources-and-tools.md#hướng-dẫn-sau-refactoring)
> - Roadmap tổng thể: [docs/plan/roadmap.md](./roadmap.md)

### [BUG] Tool createIssue chỉ tạo được issue với trường tối thiểu
- Khi truyền các trường bổ sung (assignee, labels, priority, description...), API trả về lỗi "Field ... cannot be set. It is not on the appropriate screen, or unknown."
- Nguyên nhân: Các trường này không có trên màn hình (screen) tạo issue của project/issueType tương ứng trong Jira.
- Đã xác nhận: Chỉ truyền projectKey và summary thì tạo issue thành công.
- Đã test updateIssue: Có thể cập nhật các trường bổ sung sau khi issue đã được tạo.

#### Kế hoạch fix
- [x] Fix tool createIssue: Kiểm tra metadata (createmeta) trước khi map trường vào payload gửi lên Jira, chỉ gửi các trường có trên screen.
- [x] Nếu user truyền trường không khả dụng, bỏ qua khi tạo issue và log warning.
- [x] Test lại với các trường hợp: chỉ trường tối thiểu, thêm từng trường bổ sung, test updateIssue sau khi tạo.
- [ ] Cập nhật tài liệu, schema, hướng dẫn sử dụng tool createIssue (khuyến nghị tạo issue tối thiểu, update sau nếu cần).

### [BUG] Tool filter (createFilter, updateFilter, deleteFilter) gặp nhiều lỗi
- Khi test các tool filter, gặp nhiều lỗi liên quan đến context, email và payload.
- **Nguyên nhân 1**: MCP server inject `atlassianConfig` vào context, nhưng tool lại cố truy cập `context.config` gây lỗi undefined.
- **Nguyên nhân 2**: Payload khi update filter đang gửi cả các trường không hợp lệ theo API Jira, gây lỗi "Invalid request payload".

#### Kế hoạch fix
- [x] Fix vấn đề context cho toàn bộ tool filter: sử dụng đúng `context.atlassianConfig` thay vì `context.config`.
- [x] Fallback sang biến môi trường nếu thiếu thông tin email trong context.
- [x] Fix việc update filter: chỉ gửi các trường hợp lệ (name, jql, description, favourite, sharePermissions).
- [x] Test lại các chức năng tạo, cập nhật và xóa filter.
- [ ] Cập nhật tài liệu, hướng dẫn sử dụng tools filter. 