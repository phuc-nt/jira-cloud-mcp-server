# TODO MCP Atlassian Server – Ưu tiên kiểm thử & fix bug resource/tool mới

Tài liệu này liệt kê các task quan trọng, cần thực hiện ngay để đảm bảo các resource và tool nâng cao vừa thêm vào hoạt động ổn định, đúng chuẩn MCP, tương thích tốt với Cline.

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
- Sau khi hoàn thành checklist, merge lại vào main và cập nhật roadmap tổng thể. 