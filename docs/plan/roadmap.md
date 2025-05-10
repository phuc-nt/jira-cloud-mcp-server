# Roadmap phát triển MCP Atlassian Server

Roadmap này mô tả các giai đoạn phát triển trong tương lai của MCP Atlassian Server, tập trung vào tối ưu hóa cho môi trường local và cải thiện trải nghiệm người dùng.

## Phase 10: Chuẩn Bị Quốc Tế Hóa và Publish Lên Marketplace

### 0. Chuyển đổi ngôn ngữ sang tiếng Anh cho phiên bản quốc tế
- [x] Chuyển đổi tất cả comment trong code sang tiếng Anh
- [x] Chuyển đổi tất cả message dành cho end user sang tiếng Anh
- [x] Dịch README.md sang tiếng Anh với đầy đủ hướng dẫn cài đặt và cấu hình (đã đồng bộ với llms-install.md, loại bỏ trùng lặp)
- [ ] Dịch tất cả documentation files trong thư mục docs/
- [x] Chuyển đổi schema descriptions và metadata trong các resource/tool sang tiếng Anh
- [x] Chuẩn hóa các thông báo lỗi, log messages sang tiếng Anh với format nhất quán
- [x] Chuyển đổi tên biến/hàm có tiếng Việt (nếu có) sang tiếng Anh
- [x] Đảm bảo tất cả error response và API messages đều bằng tiếng Anh
- [x] Tạo file llms-install.md theo chuẩn hướng dẫn marketplace
- [x] Kiểm tra lại code base đảm bảo không còn nội dung tiếng Việt
- [x] Đã migrate toàn bộ resource Jira sang API v3, hỗ trợ ADF cho description/comment, cập nhật tài liệu liên quan (6/2025)

> **Ghi chú tiến độ:**
> - Đã hoàn thành chuyển đổi toàn bộ codebase (resource, tool, utils, entrypoint) sang tiếng Anh.
> - Không còn nội dung tiếng Việt trong code, comment, message, log, error message ở các file đã chuyển đổi.
> - Đã hoàn thành file llms-install.md (bản tiếng Anh, chuẩn marketplace, nhấn mạnh ưu tiên cho Cline).
> - README.md và llms-install.md đã đồng bộ nội dung, loại bỏ trùng lặp, cảnh báo rõ Docker là experimental.
> - Đã bổ sung demo GIF vào README.md, có sơ đồ kiến trúc và flow, tài liệu đã rõ ràng, thân thiện.
> - Sẵn sàng cho các bước tiếp theo: kiểm thử, chuẩn bị tài liệu, hình ảnh, script cài đặt, và submit lên marketplace.

### 1. Chuẩn bị repository theo yêu cầu marketplace
- [x] Đảm bảo repository đã công khai trên GitHub
- [x] Cập nhật README.md tiếng Anh với "Quick Start" rõ ràng, hướng dẫn cài đặt theo từng bước
- [x] Thêm hướng dẫn chi tiết về cấu hình Cline cho cả Docker (cảnh báo experimental) và Node.js local
- [x] Tạo file `llms-install.md` với hướng dẫn cài đặt chi tiết cho AI
- [x] Bổ sung demo GIF vào README.md, tăng trải nghiệm showup cho user phổ thông

### 2. Tối ưu hóa cài đặt "một nhấp chuột"
- [ ] Viết script tự động cài đặt/build với ít tham số nhập vào nhất có thể
- [ ] Cung cấp ví dụ cấu hình đầy đủ trong README và llms-install.md
- [ ] Xử lý các trường hợp lỗi thường gặp, thêm phần troubleshooting
- [ ] Tạo cơ chế tự validate thông tin đăng nhập Atlassian trong quá trình cài đặt

### 3. Chuẩn bị tài liệu và hình ảnh quảng bá
- [x] Thiết kế logo PNG 400×400 cho MCP Atlassian Server (đã có logo webp và PNG chuẩn marketplace)
- [x] Viết mô tả ngắn nhưng hấp dẫn về lợi ích MCP Atlassian Server
- [x] Tạo 1-2 ảnh demo chức năng chính (đã có GIF demo lớn trong README.md)
- [x] Chuẩn bị bài viết nộp lên marketplace với nội dung đầy đủ theo template

### 4. Test và đảm bảo chất lượng
- [x] Test toàn diện chức năng với Cline local
- [x] Test cấu hình Docker và Node.js local theo hướng dẫn trong README
- [x] Đảm bảo không có lỗi nào trong quá trình cài đặt tự động
- [x] Mô phỏng user flow từ cài đặt đến sử dụng đầu tiên

### 5. Thực hiện submit lên marketplace
- [x] Tạo issue trên Cline MCP Marketplace repository ([#292](https://github.com/cline/mcp-marketplace/issues/292))
- [ ] Đính kèm thông tin cần thiết: GitHub URL, logo, mô tả
- [ ] Theo dõi phản hồi và sẵn sàng cập nhật theo yêu cầu
- [ ] Xác nhận lại người dùng có thể cài đặt dễ dàng từ marketplace

## Phase 11: Tối Ưu Hóa và Mở Rộng Resources (ưu tiên Local-first)

### 1. Đơn giản hóa xác thực cho môi trường local
- [ ] Hướng dẫn chi tiết cách thiết lập biến môi trường `.env` và config cho Cline, tránh phức tạp hóa OAuth nếu chưa cần thiết
- [ ] Nếu muốn thử nghiệm OAuth, chỉ cần hỗ trợ flow đơn giản, không cần multi-tenant hoặc cloud callback

### 2. Tối ưu hiệu suất và trải nghiệm local
- [ ] Áp dụng caching in-memory (LRU hoặc TTL) cho các resource phổ biến (danh sách project, user, space, board, v.v.)
- [ ] Thêm tuỳ chọn bật/tắt cache qua biến môi trường
- [ ] Đảm bảo các lỗi mạng, lỗi xác thực được trả về rõ ràng, dễ debug cho user cá nhân

### 3. Mở rộng resource cho Jira/Confluence (ưu tiên các API có ích cho developer cá nhân)
- [x] **Done** - Sửa lỗi encode JQL có ký tự đặc biệt/dấu cách trong resource issues (tham khảo [test-report.md](../test-reports/cline-test-2025-04-20.md))
- [x] **Done** - Cải thiện tool createPage: validate parentId, content storage format, thông báo lỗi rõ ràng
- [x] **Done** - Tool updatePage: fix lỗi xóa label (DELETE trả về body rỗng, không parse JSON)
- [ ] Cho phép truyền query params (filter, limit, sort) cho các resource dạng danh sách
- [x] **Done** - Bổ sung schema (metadata) cho tất cả resource MCP để client (Cline) hiển thị đúng kiểu dữ liệu trả về. Tham khảo hướng dẫn chi tiết: [dev-guide/schema-metadata.md](../dev-guide/schema-metadata.md)
- [x] **Done** - Chuẩn hóa test client, tự động hóa kiểm thử resource/tool
- [x] **Done** - Chia nhỏ file test thành nhiều file theo nhóm resource, dễ bảo trì và mở rộng
- [x] **Done** - Tiếng Anh hóa toàn bộ code test client (comment, log, biến mô tả)
- [ ] Bổ sung validation chi tiết cho các tham số tool
- [x] **Done** - **Jira: Filters** – Truy vấn danh sách filter, chi tiết filter, filter cá nhân
- [x] **Done** - **Jira: Boards** – Truy vấn board, board config, board issues
- [x] **Done** - **Jira: Sprints** – Truy vấn sprint, sprint issues, board sprints
- [x] **Done** - **Jira: Dashboards** – Truy vấn dashboard, gadget, dashboard cá nhân
- [x] **Done** - **Confluence: Labels, Attachments, Content Versions** – Quản lý tài liệu nâng cao

### 3.2. Chuẩn hóa & mở rộng resource/tool MCP (2025-06)

- [x] Refactor toàn bộ resource/tool chỉ dùng `atlassian-api.ts`, loại bỏ hoàn toàn JS cũ, đồng bộ type-safe.
- [x] Migrate toàn bộ resource Jira sang API v3, xử lý ADF, cập nhật schema, bổ sung hàm chuyển ADF.
- [x] Migrate toàn bộ resource/tool Confluence sang API v2, loại bỏ hoàn toàn endpoint v1, cập nhật schema, tài liệu, test.
- [x] Mở rộng resource/tool nâng cao: Dashboards, Gadgets, Board Actions, Sprint Actions, Backlog Actions, Dashboard/Gadget Actions.
- [x] Bổ sung các tool Confluence: updatePageTitle, updateFooterComment, deleteFooterComment, deletePage.
- [x] Đăng ký đồng bộ tất cả tool qua `registerAllTools`, Cline nhận đủ tool nâng cao.
- [x] Chuẩn hóa tài liệu: cập nhật README.md, docs/introduction/resources-and-tools.md, roadmap.
- [x] Xóa file JS/TS thừa (bao gồm label-page.ts), kiểm tra lại codebase, build thành công.
- [x] Test lại toàn bộ với Cline, xác nhận resource/tool mới hoạt động tốt.
- [x] **Refactor file lớn `atlassian-api.ts` thành các module nhỏ dễ maintain**: tách thành base helper, resource API, tool API riêng biệt cho Jira/Confluence.
- [x] **Tách module Jira tools theo endpoint** (`/rest/api/3` và `/rest/agile/1.0`) thành hai file riêng, giữ backward compatibility.
- [x] **Cập nhật hướng dẫn chi tiết** cho developer về cách thêm mới và maintain resource/tool sau refactor.
- [x] **Bổ sung tài liệu refactor** trong docs/introduction/resources-and-tools.md và cập nhật README.md với thông tin mới.

### 3.3. Kết quả kiểm thử JIRA Tool với project XDEMO2 (2025-06)

#### Các tool đã kiểm thử thành công:
- [x] **Done** - createIssue: Tạo issue với đầy đủ trường, bao gồm labels
- [x] **Done** - updateIssue: Cập nhật các trường của issue
- [x] **Done** - assignIssue: Đổi assignee cho issue
- [x] **Done** - transitionIssue: Chuyển trạng thái issue (lấy đúng transitionId)
- [x] **Done** - createFilter, updateFilter, deleteFilter: Tạo, cập nhật, xóa filter
- [x] **Done** - createSprint, startSprint, closeSprint: Tạo, bắt đầu, đóng sprint (có test cả completeDate)
- [x] **Done** - addIssueToBoard: Thêm issue vào board Kanban và Scrum
- [x] **Done** - addIssuesToBacklog: Thêm issue vào backlog, hoạt động đúng với/không với boardId
- [x] **Done** - addIssueToSprint: Thêm nhiều issue vào sprint thành công (thay thế removeIssuesFromBacklog)
- [x] **Done** - rankBacklogIssues: Sắp xếp thứ tự issue trong backlog, xử lý response rỗng chuẩn
- [x] **Done** - createDashboard, updateDashboard: Tạo và cập nhật dashboard
- [x] **Done** - addGadgetToDashboard, removeGadgetFromDashboard: Thêm và xóa gadget trên dashboard
- [x] **Done** - Fixed resource jira://dashboards/{dashboardId}/gadgets: Sửa lỗi trả về danh sách gadget rỗng (thay đổi endpoint từ /gadgets thành /gadget)

#### Các lỗi đã gặp và đã được sửa:
- [x] **Done** - Lỗi mapping trường khi tạo issue (labels, assignee, ...)
- [x] **Done** - Lỗi thiếu trường email khi thao tác filter
- [x] **Done** - Lỗi parse JSON khi thao tác board/backlog
- [x] **Done** - Lỗi payload khi closeSprint với completeDate
- [x] **Done** - Lỗi "Unexpected end of JSON input" khi API trả về response rỗng (thành công)

#### Các tool cần tiếp tục kiểm thử:
<!-- Xóa mục này vì đã kiểm tra tất cả các tool chính -->

> **Ghi chú tiến độ:**
> - Đã hoàn thành chuẩn hóa codebase, tài liệu, schema, tool/resource.
> - Đã đồng bộ tài liệu, bảng resource/tool, loại bỏ hướng dẫn cũ.
> - Đã test thực tế với Cline, Cline nhận đủ tool/resource nâng cao.
> - Đã hoàn tất refactor file `atlassian-api.ts` từ >2000 dòng thành các module nhỏ dễ maintain, với cấu trúc rõ ràng.
> - Đã cập nhật tài liệu chi tiết cho developers về cách thêm mới và maintain code sau refactoring.
> - Các luồng chính về issue, filter, sprint, board/backlog đã được kiểm thử đầy đủ và xác nhận hoạt động ổn định.
> - Đã hợp nhất tool backlog/sprint cho đồng nhất: **addIssueToSprint** thay thế removeIssuesFromBacklog và moveIssuesBetweenSprints; **addIssuesToBacklog** hỗ trợ cả backlog chung và backlog cụ thể của board.
> - Đã kiểm thử đầy đủ các thao tác dashboard/gadget: thêm, xóa gadget, đồng thời sửa lỗi resource jira://dashboards/{dashboardId}/gadgets trả về rỗng.

### 4. Cải thiện developer experience cho local dev
- [ ] Viết script tự động build và tạo symlink cho Cline nhận diện nhanh (không cần docker nếu chưa cần)
- [ ] Thêm hướng dẫn debug MCP server khi chạy cùng Cline (log ra stderr, hướng dẫn mở devtools của VS Code)
- [ ] Viết test case minh hoạ cho từng resource/tool (có thể chạy độc lập, không cần cloud)

## Phase 12: Tối ưu hóa trải nghiệm với Cline và MCP Client Local

- [x] **Done** - Đã hoàn thành test toàn bộ resource/tool Jira gồm: Issue, Filter, Sprint, Board, Backlog, Dashboard, Gadget
- [x] **Done** - Đã fix tất cả lỗi phát hiện được, đặc biệt là lỗi resource jira://dashboards/{dashboardId}/gadgets trả về rỗng

### 1. Tối ưu hóa phản hồi cho Cline
- [ ] Chuẩn hóa markdown và metadata trong phản hồi để Cline hiển thị đẹp, dễ đọc
- [ ] Thêm ví dụ về MCP Rule/Prompt cho Cline, giúp AI tự động sử dụng resource/tool đúng ngữ cảnh
- [ ] Viết hướng dẫn cấu hình MCP server cho Cline (cấu hình file, biến môi trường, cách restart server)

### 2. Hỗ trợ cá nhân hóa và tuỳ biến cho user local
- [ ] Cho phép user lưu cấu hình project, filter, space yêu thích vào local file
- [ ] Cho phép user cấu hình alias cho các resource/tool thường dùng
- [ ] Hỗ trợ export/import cấu hình cá nhân dễ dàng chia sẻ

### 3. Đóng gói và phân phối cho developer cá nhân
- [ ] Chuẩn bị script cài đặt nhanh cho Mac/Linux/Windows (không cần cloud)
- [ ] Viết tài liệu "Getting Started with MCP Atlassian for Cline" dành cho developer tự học
- [ ] Chuẩn bị bộ ví dụ (sample project, sample .env, sample MCP client test script)

## Phase 13: Chia sẻ kiến thức, chuẩn bị seminar, xây dựng cộng đồng

### 1. Chuẩn bị nội dung chia sẻ, seminar, workshop
- [ ] Viết bài blog/bài hướng dẫn về MCP, phân biệt Tool vs Resource, best practice cho local dev
- [ ] Xây dựng slide, demo script cho seminar "MCP hoá Atlassian nội bộ với Cline"
- [ ] Tạo video demo thao tác thực tế với Cline, MCP Inspector, test script

### 2. Đóng góp và xây dựng cộng đồng MCP
- [ ] Đăng source code lên GitHub với README chi tiết, hướng dẫn chạy local-first
- [ ] Tham gia thảo luận, trả lời câu hỏi trên các diễn đàn MCP (GitHub Discussions, Discord, v.v.)
- [ ] Mở issues, PR hoặc đóng góp tài liệu cho MCP SDK nếu phát hiện bug hoặc có đề xuất cải tiến

### 3. Tích hợp phản hồi và mở rộng dần
- [ ] Thu thập phản hồi từ đồng nghiệp, cộng đồng về trải nghiệm local-first
- [ ] Ưu tiên cải tiến dựa trên feedback thực tế của user cá nhân/Cline
- [ ] Nếu có nhu cầu, chuẩn bị tài liệu chuyển đổi lên cloud hoặc multi-user (phase sau, không ưu tiên hiện tại)

## Phase 14: (Tuỳ chọn, khi đã vững local) - Chuẩn bị cho Cloud/Multi-user

### 1. Thiết kế cho môi trường production
- [ ] Thiết kế lại authentication, multi-tenant, rate limiting, logging cho production/cloud
- [ ] Chuẩn bị Docker image production-ready, hướng dẫn deploy lên server/cloud
- [ ] Tối ưu bảo mật (token rotation, audit log, v.v.)

### 2. Mở rộng tính năng cho multi-user
- [ ] Xây dựng hệ thống quản lý người dùng
- [ ] Triển khai cơ chế phân quyền chi tiết
- [ ] Thiết lập monitoring và alerting
- [ ] Viết migration guide từ local lên cloud

## Tóm tắt ưu tiên

Roadmap này tập trung vào các ưu tiên sau:
1. **Quốc tế hóa và Marketplace**: Chuyển đổi tất cả nội dung sang tiếng Anh và publish lên Cline Marketplace
2. **Local-first**: Tối ưu trải nghiệm cho người dùng local trước khi mở rộng lên cloud
3. **Developer Experience**: Cải thiện trải nghiệm cho developer sử dụng MCP Atlassian với Cline
4. **Knowledge Sharing**: Chia sẻ kiến thức và xây dựng cộng đồng xung quanh MCP
5. **Incremental Growth**: Phát triển dần dần dựa trên phản hồi thực tế

Các phase tiếp theo sẽ liên tục được cập nhật dựa trên tiến độ thực tế và phản hồi từ cộng đồng.

## Các vấn đề tồn đọng cần giải quyết

1. **Lỗi CQL Confluence Query**: Resource `confluence://pages?cql=space="TX"` trả về lỗi "Could not parse cql", có thể do cú pháp CQL chưa đúng hoặc API yêu cầu format khác. Cần nghiên cứu thêm về định dạng CQL chính xác cho Confluence API.

2. **Xử lý DELETE response**: Khi gọi API Atlassian (Confluence) với DELETE, response body thường rỗng. Nếu cố parse JSON sẽ lỗi "Unexpected end of JSON input". **Best practice:** chỉ parse JSON khi chắc chắn có body, hoặc kiểm tra text trước.

3. **Expand metadata cho Page Labels**: Khi trả về resource page, nên expand metadata.labels và trả về danh sách label cho client để hiển thị đầy đủ thông tin.

4. **Bỏ Resource jira://users**: Resource `jira://users` yêu cầu tham số truy vấn (username hoặc accountId), nên không thể truy cập trực tiếp mà không cung cấp tham số. Đây là giới hạn của API Jira, không phải lỗi của MCP server. **Đã xử lý:** Resource này đã bị loại bỏ, thay vào đó người dùng nên sử dụng các resource cụ thể hơn như `jira://users/{accountId}` hoặc `jira://users/assignable/{projectKey}`.

## History

### 2025-06-xx
- Chuẩn hóa metadata/schema cho tất cả resource MCP Atlassian Server.
- Chia nhỏ file test thành nhiều file theo nhóm resource, dễ bảo trì và mở rộng.
- Tiếng Anh hóa toàn bộ code test client, đảm bảo tất cả comment, log, biến mô tả đều bằng tiếng Anh.
- Đã migrate hoàn toàn resource/tool Confluence sang API v2, không còn hỗ trợ API v1.

> **Lưu ý:** MCP Atlassian Server đã migrate hoàn toàn resource và tool Confluence sang API v2 (`/wiki/api/v2/`). Không còn hỗ trợ API v1. Nếu còn sử dụng API v1, bạn sẽ không thể truy cập resource/tool Confluence. 