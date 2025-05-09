# TODO MCP Atlassian Server – Ưu tiên kiểm thử & fix bug resource/tool mới

Tài liệu này liệt kê các task quan trọng, cần thực hiện ngay để đảm bảo các resource và tool nâng cao vừa thêm vào hoạt động ổn định, đúng chuẩn MCP, tương thích tốt với Cline.

## [!] Ưu tiên hàng đầu: Refactor & maintainability
- [ ] Refactor file src/utils/atlassian-api.ts: chia nhỏ thành các file riêng biệt theo nhóm chức năng:
    - src/utils/confluence-resource-api.ts (các hàm resource Confluence)
    - src/utils/confluence-tool-api.ts (các hàm tool Confluence)
    - src/utils/jira-resource-api.ts (các hàm resource Jira)
    - src/utils/jira-tool-api.ts (các hàm tool Jira)
    - Giữ lại các hàm helper chung (callConfluenceApi, callJiraApi, createBasicHeaders, ...) ở file base (atlassian-api-base.ts) nếu cần.
- [ ] Update lại toàn bộ import ở các file tool/resource sử dụng các hàm này.
- [ ] Đảm bảo test lại toàn bộ resource/tool sau khi refactor, tránh lỗi import hoặc lỗi runtime.

**Kế hoạch thực hiện refactor:**
1. ✅ Tạo branch mới: `refactor/split-atlassian-api` (đã tạo)
2. 🔄 Tạo các file mới theo thiết kế trên, giữ nguyên API/function signature (cần thực hiện ngay)
3. Di chuyển code từng phần, đảm bảo import/export đúng
4. Cập nhật import ở các file khác (resource, tool)
5. Test tất cả các endpoint, tool đã hoạt động đúng
6. Code review, merge vào main

**Tình trạng hiện tại:**
- Branch `refactor/split-atlassian-api` đã được tạo
- Branch đang ở trạng thái mới, chưa có commit riêng (tách từ commit gần nhất: "docs & schema: clarify Confluence page content...")
- Cần bắt đầu bằng việc tạo file atlassian-api-base.ts và di chuyển các helper function chung
- Đảm bảo các thay đổi không ảnh hưởng đến hoạt động hiện tại của hệ thống

**Tập trung vào các phần quan trọng:**
- Helper functions chung: `callConfluenceApi`, `callJiraApi`, `createBasicHeaders`, etc.
- Interface/type định nghĩa API response (đảm bảo export/import đúng)
- Các hàm CRUD Confluence page, comment, space
- Các hàm CRUD Jira issue, project, board
- Xử lý lỗi và logging (đảm bảo nhất quán giữa các file mới)

**Lợi ích của việc refactor:**
- Giảm kích thước file quá lớn (hiện tại ~2010 dòng)
- Dễ dàng maintain, mở rộng tính năng theo từng domain
- Giảm xung đột khi nhiều dev làm việc đồng thời
- Cải thiện khả năng đọc code, debug
- Tách biệt rõ ràng giữa các nhóm chức năng (Jira/Confluence, tool/resource)

## Ưu tiên kiểm thử & fix bug (tháng 6/2025)

### 1. Test & fix nhóm Resource mới
- [ ] Test resource Dashboards (`jira://dashboards`, `jira://dashboards/my`, `jira://dashboards/{dashboardId}`, `jira://dashboards/{dashboardId}/gadgets`)
- [ ] Test resource Board nâng cao (board issues, sprints, config...)
- [ ] Test resource Sprint nâng cao (sprint details, sprint issues...)
- [ ] Test resource Backlog (nếu có)
- [ ] Test resource Gadget (nếu có)
- [ ] Kiểm tra schema, metadata trả về đã đúng chuẩn MCP, Cline hiển thị đúng chưa
- [ ] Kiểm tra phân trang, filter, param nâng cao (nếu có)
- [ ] Resource `confluence://pages` (filter nâng cao) vẫn chưa hoạt động đúng với filter (`space-id`, `label`, `status`, ...). Chỉ hoạt động khi không truyền filter. Cần debug và hoàn thiện mapping filter từ client sang API v2.
    - Ưu tiên kiểm tra biến thể tên filter, log params đầu vào, so sánh với curl thành công.
    - Để lại xử lý sau.
- [ ] [Confluence] API v2 KHÔNG hỗ trợ add/remove label cho page. Đã xoá toàn bộ tool, resource, helper liên quan. Nếu Atlassian cập nhật lại API, cần review lại logic này.

### 2. Test & fix nhóm Tool nâng cao
- [ ] Test tool addIssueToBoard
- [ ] Test tool configureBoardColumns
- [ ] Test tool startSprint, closeSprint, moveIssuesBetweenSprints
- [ ] Test tool addIssuesToBacklog, removeIssuesFromBacklog, rankBacklogIssues
- [ ] Test tool createDashboard, updateDashboard, addGadgetToDashboard, removeGadgetFromDashboard
- [ ] Test tool liên quan đến label, attachment, version (Confluence)
- [ ] Kiểm tra validate input, error message, status trả về
- [ ] Đảm bảo tool hoạt động đúng với Cline (gọi được, trả về kết quả đúng, status rõ ràng)

### 3. Checklist bổ sung
- [ ] Bổ sung test case minh hoạ cho từng resource/tool mới (có thể chạy độc lập)
- [ ] Ghi chú lại các bug, edge case phát hiện trong quá trình test
- [ ] Fix bug, refactor code/tool nếu phát hiện lỗi hoặc chưa chuẩn hóa
- [ ] Cập nhật lại tài liệu (README, resources-and-tools.md, roadmap) nếu có thay đổi lớn

---

**Lưu ý:**
- Ưu tiên test thực tế với Cline, kiểm tra cả UI và API response.
- Ghi chú bug, edge case, đề xuất refactor trực tiếp vào file này hoặc tạo issue trên GitHub.
- Sau khi hoàn thành refactor (split atlassian-api) nên test toàn diện với:
  - Test thủ công các tool cơ bản (createPage, getPage, updatePage, etc.)
  - Test thủ công các resource (jira://issues, confluence://pages, etc.)
  - Test các công cụ liên quan đến attachments, comments
  - Kiểm tra thời gian phản hồi và performance
- Sau khi hoàn thành checklist, merge lại vào main và cập nhật roadmap tổng thể. 