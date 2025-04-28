### Tại sao Resource tổ chức theo entity, còn Tool tổ chức theo action? Tool có thể tổ chức theo entity được không?

#### 1. Lý do Resource tổ chức theo entity (projects, issues...)

- **Bản chất của Resource là dữ liệu chỉ đọc (read-only), không tác dụng phụ**. Theo MCP, Resource là "application-controlled", tức là ứng dụng quyết định dữ liệu nào được cung cấp cho AI, giống như các endpoint GET trong REST API[5][1].
- **Entity-centric**: Các resource thường phản ánh các thực thể (entity) trong hệ thống (project, issue, user, page, space...). Điều này giúp AI hoặc client dễ dàng khám phá, duyệt, và truy vấn dữ liệu có cấu trúc, giống như truy cập bảng trong database hoặc collection trong REST.
- **URI nhất quán**: MCP Resources sử dụng URI pattern nhất quán, ví dụ: `jira://projects/{projectKey}` hoặc `jira://issues/{issueKey}`. Điều này giúp client tự động hóa việc truy cập và khám phá dữ liệu, đồng thời dễ dàng ánh xạ với các thực thể trong hệ thống[4].

#### 2. Lý do Tool tổ chức theo action (createIssue, updatePage...)

- **Bản chất của Tool là thực hiện hành động, có thể thay đổi trạng thái hệ thống**. Theo MCP, Tool là "model-controlled", tức là AI chủ động quyết định khi nào và cách nào gọi tool, thường với sự xác nhận của người dùng[2][5].
- **Action-centric**: Tool đại diện cho các thao tác (action) như tạo, cập nhật, xóa, chuyển trạng thái... Vì vậy, tên tool thường là động từ hoặc cụm động từ, phản ánh rõ mục đích hành động (createIssue, assignIssue, updatePage...)[5][6].
- **Schema mạnh mẽ**: Tool sử dụng schema (thường là Zod) để định nghĩa input/output, giúp AI biết chính xác cần cung cấp thông tin gì để thực hiện action[4].
- **Tối ưu cho agentic workflow**: Trong kiến trúc agent, AI cần biết "tôi có thể làm gì" (action nào), nên tổ chức theo action giúp AI lập kế hoạch, reasoning và quyết định khi nào gọi tool[6].

#### 3. Tool có thể tổ chức theo entity được không?

**Về mặt kỹ thuật, hoàn toàn có thể tổ chức tool theo entity** (ví dụ: một nhóm "issue" có các tool con như "create", "update", "transition", "assign"...). Tuy nhiên, theo chuẩn MCP và best practice của ngành:

- **Tên tool vẫn nên phản ánh rõ hành động chính** (action-centric), ví dụ: `createIssue`, `updateIssue`, `transitionIssue`. Điều này giúp AI và user hiểu ngay mục đích của tool, dễ mapping với các lệnh tự nhiên của người dùng[5].
- **Có thể nhóm tool theo entity trong codebase hoặc UI** để dễ quản lý, nhưng interface MCP expose ra ngoài vẫn nên là action-centric.
- **Nếu tổ chức tool theo entity** (ví dụ: `issue.create`, `issue.update`), thì tên tool vẫn phải rõ ràng về action, và schema input phải tách bạch từng hành động.

#### 4. Tổng kết và khuyến nghị

- **Resource nên tổ chức theo entity** vì phản ánh dữ liệu có cấu trúc, dễ truy vấn, dễ khám phá, không side-effect.
- **Tool nên tổ chức theo action** vì phản ánh hành động, giúp AI lập kế hoạch, reasoning, và phù hợp với agentic workflow.
- **Có thể nhóm tool theo entity trong codebase**, nhưng tên tool expose ra MCP vẫn nên là action-centric.
- **Không nên dùng tool cho các tác vụ chỉ đọc** (read-only), hãy dùng resource để tối ưu hóa hiệu suất, bảo mật và trải nghiệm AI.

**Tài liệu tham khảo:**[1][5][6] MCP chính thức, LinkedIn, HuggingFace, Reddit, WWT, Workato, GitHub MCP Server Guide.

Citations:
[1] https://www.wwt.com/blog/model-context-protocol-mcp-a-deep-dive
[2] https://www.reddit.com/r/ClaudeAI/comments/1jso42a/mcp_resources_vs_tools/
[3] https://www.workato.com/the-connector/what-is-mcp/
[4] https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-server-development-guide.md
[5] https://www.linkedin.com/pulse/demystifying-model-context-protocol-mcp-how-ai-shen-phd-emba-jax5e
[6] https://huggingface.co/blog/Kseniase/mcp
[7] https://modelcontextprotocol.io/introduction
[8] https://wandb.ai/onlineinference/mcp/reports/The-Model-Context-Protocol-MCP-by-Anthropic-Origins-functionality-and-impact--VmlldzoxMTY5NDI4MQ
[9] https://dev.to/pavanbelagatti/model-context-protocol-mcp-8-mcp-servers-every-developer-should-try-5hm2
[10] https://huggingface.co/blog/Kseniase/mcp
[11] https://github.com/cyanheads/model-context-protocol-resources/blob/main/guides/mcp-server-development-guide.md
[12] https://www.confluent.io/blog/ai-agents-using-anthropic-mcp/
[13] https://modelcontextprotocol.io/docs/concepts/resources
[14] https://mcp.so/zh/server/xai-mcp-claude/tyler-jewell?tab=content
[15] https://www.linkedin.com/pulse/securing-model-context-protocol-mcp-challenges-best-muayad-sayed-ali-sot4e
[16] https://www.speakeasy.com/mcp/tools
[17] https://www.byteplus.com/en/topic/542071
[18] https://www.blott.studio/blog/post/mcp-explained-building-better-ai-model-interactions
[19] https://modelcontextprotocol.io/docs/concepts/tools
[20] https://devblogs.microsoft.com/semantic-kernel/integrating-model-context-protocol-tools-with-semantic-kernel-a-step-by-step-guide/
[21] https://www.linkedin.com/pulse/best-practices-mcp-servers-gaurang-desai-7ptqc
[22] https://www.anthropic.com/news/model-context-protocol
[23] https://icodealot.com/so-you-need-an-mcp-tool-now-what/
[24] https://www.reddit.com/r/mcp/comments/1jrv2fp/what_are_strategies_for_publishing_mcps_for/
[25] https://www.byteplus.com/en/topic/542172
[26] https://www.byteplus.com/en/topic/541339
[27] https://www.datacamp.com/tutorial/mcp-model-context-protocol
[28] https://www.arsturn.com/blog/how-to-successfully-integrate-multiple-mcp-tools-in-one-application
[29] https://docs.cursor.com/context/model-context-protocol
[30] https://humanloop.com/blog/mcp
[31] https://scrapfly.io/blog/what-is-mcp-understanding-the-model-context-protocol/
[32] https://www.workato.com/the-connector/what-is-mcp/
[33] https://blog.griffinai.io/news/mcp-new-standard-ai-agent-communication
[34] https://github.com/cyanheads/model-context-protocol-resources
[35] https://github.com/awslabs/mcp/blob/main/DESIGN_GUIDELINES.md
[36] https://www.philschmid.de/mcp-introduction
[37] https://blog.logto.io/a2a-mcp
[38] https://www.merge.dev/blog/mcp-best-practices
[39] https://github.com/lastmile-ai/mcp-agent

---
Answer from Perplexity: pplx.ai/share 