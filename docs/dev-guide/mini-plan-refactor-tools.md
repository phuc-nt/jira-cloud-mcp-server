# Mini-Plan Để Refactoring Nhóm Tools

Dựa trên phân tích về sự khác biệt giữa cách tổ chức Resource và Tool trong codebase hiện tại, dưới đây là kế hoạch refactoring nhóm Tools để cải thiện tính nhất quán, khả năng bảo trì và tuân thủ guidelines.

## Giai Đoạn 1: Chuẩn Bị và Phân Tích

1. **Kiểm tra và phân loại tools hiện tại**
   - Phân loại tools theo chức năng (Jira/Confluence)
   - Xác định các tools thực sự cần thay đổi trạng thái (mutations) vs chỉ đọc (đã chuyển sang Resources)
   - Lập danh sách tools cần refactor

2. **Thiết lập unit tests**
   - Viết tests cho các tools hiện tại trước khi refactor
   - Đảm bảo coverage cho các use cases quan trọng

## Giai Đoạn 2: Thiết Kế Cấu Trúc Mới

3. **Chuẩn hóa cách đặt tên và tổ chức**
   ```
   /src
     /tools
       /jira
         /issue
           index.ts          # Tổng hợp đăng ký
           create.ts         # createIssue
           transition.ts     # transitionIssue
           assign.ts         # assignIssue
         /comment
           index.ts
           add.ts            # addComment
       /confluence
         /page
           index.ts
           create.ts         # createPage
           update.ts         # updatePage
       index.ts              # Đăng ký tập trung tất cả tools
     /utils
       tool-helpers.ts       # Các utility functions
   ```

4. **Tạo các helper functions chuẩn hóa**
   ```typescript
   // src/utils/tool-helpers.ts
   import { z } from 'zod';
   import { Logger } from './logger.js';

   const logger = Logger.getLogger('MCPTool');

   export function createToolResponse(text: string) {
     return {
       content: [{ type: 'text', text }]
     };
   }

   export function createErrorResponse(error: Error | string) {
     const message = error instanceof Error ? error.message : error;
     return {
       content: [{ type: 'text', text: `Error: ${message}` }],
       isError: true
     };
   }

   export function registerTool(server, name, description, schema, handler) {
     logger.info(`Registering tool: ${name}`);
     server.tool(name, schema, async (params, context) => {
       try {
         logger.debug(`Executing tool ${name} with params:`, params);
         const result = await handler(params, context);
         logger.debug(`Tool ${name} executed successfully`);
         return result;
       } catch (error) {
         logger.error(`Error in tool ${name}:`, error);
         return createErrorResponse(error);
       }
     });
   }
   ```

## Giai Đoạn 3: Triển Khai Refactoring

5. **Thực hiện refactoring theo từng nhóm nhỏ**
   - Bắt đầu với một nhóm tools (ví dụ: Jira issue tools)
   - Refactor từng tool một, chạy tests sau mỗi lần thay đổi

6. **Mẫu triển khai cho một tool cụ thể**
   ```typescript
   // src/tools/jira/issue/create.ts
   import { z } from 'zod';
   import { createToolResponse, createErrorResponse } from '../../../utils/tool-helpers.js';

   export const createIssueSchema = z.object({
     projectKey: z.string().describe('Project key (e.g., PROJ)'),
     summary: z.string().describe('Issue title/summary'),
     description: z.string().optional().describe('Detailed description'),
     issueType: z.string().default('Task').describe('Type of issue')
   });

   export async function createIssueHandler(params, context) {
     try {
       const config = context.get('atlassianConfig');
       if (!config) {
         throw new Error('Atlassian configuration not found');
       }

       // Logic tạo issue...
       
       return createToolResponse(`Issue ${newIssue.key} created successfully`);
     } catch (error) {
       return createErrorResponse(error);
     }
   }

   export function registerCreateIssueTool(server) {
     server.tool(
       'createIssue',
       createIssueSchema,
       createIssueHandler
     );
   }
   ```

7. **Tạo index.ts để đăng ký tập trung**
   ```typescript
   // src/tools/jira/issue/index.ts
   import { registerCreateIssueTool } from './create.js';
   import { registerTransitionIssueTool } from './transition.js';
   import { registerAssignIssueTool } from './assign.js';

   export function registerJiraIssueTools(server) {
     registerCreateIssueTool(server);
     registerTransitionIssueTool(server);
     registerAssignIssueTool(server);
   }
   ```

   ```typescript
   // src/tools/index.ts
   import { registerJiraIssueTools } from './jira/issue/index.js';
   import { registerJiraCommentTools } from './jira/comment/index.js';
   import { registerConfluencePageTools } from './confluence/page/index.js';

   export function registerAllTools(server) {
     registerJiraIssueTools(server);
     registerJiraCommentTools(server);
     registerConfluencePageTools(server);
   }
   ```

## Giai Đoạn 4: Đảm Bảo Chất Lượng và Hoàn Thiện

8. **Kiểm tra và tài liệu hóa**
   - Chạy tất cả unit tests
   - Cập nhật tài liệu phát triển
   - Thêm ví dụ cho từng tool

9. **Đồng bộ hóa với cấu trúc Resource**
   - Đảm bảo sự nhất quán giữa naming và pattern giữa Tools và Resources
   - Xác minh không có trùng lặp chức năng giữa hai nhóm

10. **Đánh giá và optimizing**
    - Xác định các patterns chung và cơ hội trừu tượng hóa
    - Kiểm tra hiệu suất nếu cần

## Best Practices Khi Refactoring Tools

- **Duy trì tính atom**: Mỗi tool chỉ thực hiện một nhiệm vụ cụ thể (nguyên tắc "do one thing well")
- **Input validation**: Sử dụng Zod schemas chi tiết và rõ ràng cho tất cả tham số
- **Error handling**: Xử lý lỗi nhất quán trong tất cả các tools
- **Logging**: Log đầy đủ thông tin hoạt động của tools cho debug
- **Documentation**: Tài liệu hóa rõ ràng mục đích, tham số và kết quả mong đợi
- **Testing**: Unit tests đầy đủ cho mỗi tool

Approach này sẽ giúp cải thiện tính nhất quán, khả năng bảo trì và mở rộng của nhóm Tools, đồng thời duy trì sự rõ ràng về phân chia trách nhiệm giữa Tools và Resources theo đúng guidelines của MCP. 