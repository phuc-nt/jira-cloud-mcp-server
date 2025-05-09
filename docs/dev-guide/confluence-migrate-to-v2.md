# Hướng Dẫn Migration từ Confluence API v1 sang v2

Dựa trên thông tin từ kết quả tìm kiếm, API v1 của Confluence sẽ bị loại bỏ trong tương lai gần (nhiều endpoint đã bị đánh dấu deprecated). Vì hiện tại là tháng 5/2025, việc migration là cấp thiết. Dưới đây là hướng dẫn chi tiết để chuyển đổi các resource và tool Confluence trong MCP server của bạn từ API v1 sang API v2.

## Nguyên tắc chung khi migration

1. Thay đổi base URL từ `/rest/api/` sang `/wiki/api/v2/`
2. Sử dụng endpoint chuyên biệt thay vì endpoint chung "content"
3. Thay đổi từ phân trang offset-based sang cursor-based
4. Thay thế tham số `expand` bằng các API call riêng biệt

## Migration cho Resources

### 1. Spaces

**Từ v1:**
```typescript
// Danh sách không gian
server.resource(
  "confluence-spaces",
  new ResourceTemplate("confluence://spaces", { list: undefined }),
  async (uri) => {
    const spaces = await confluenceClient.get('/rest/api/space');
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          spaces: spaces.results,
          metadata: createStandardMetadata(spaces.size, spaces.limit, spaces.start, uri.href)
        }),
        schema: spaceListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Danh sách không gian
server.resource(
  "confluence-spaces",
  new ResourceTemplate("confluence://spaces", { list: undefined }),
  async (uri) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/spaces${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const spaces = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          spaces: spaces.results,
          metadata: {
            total: spaces._links.next ? -1 : spaces.results.length, // Total unknown with cursor pagination
            limit: limit,
            hasMore: !!spaces._links.next,
            links: {
              self: uri.href,
              next: spaces._links.next ? `${uri.href}?cursor=${new URL(spaces._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: spaceListSchemaV2
      }]
    };
  }
);
```

### 2. Space Details

**Từ v1:**
```typescript
// Chi tiết không gian
server.resource(
  "confluence-space-details",
  new ResourceTemplate("confluence://spaces/{spaceKey}", { spaceKey: undefined }),
  async (uri, { spaceKey }) => {
    const space = await confluenceClient.get(`/rest/api/space/${spaceKey}`);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(space),
        schema: spaceSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Chi tiết không gian
server.resource(
  "confluence-space-details",
  new ResourceTemplate("confluence://spaces/{spaceKey}", { spaceKey: undefined }),
  async (uri, { spaceKey }) => {
    const space = await confluenceClient.get(`/wiki/api/v2/spaces/${spaceKey}`);
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify(space),
        schema: spaceSchemaV2
      }]
    };
  }
);
```

### 3. Pages

**Từ v1:**
```typescript
// Danh sách trang
server.resource(
  "confluence-pages",
  new ResourceTemplate("confluence://pages", { list: undefined }),
  async (uri) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const start = parseInt(url.searchParams.get("start") || "0");
    
    const pages = await confluenceClient.get(`/rest/api/content/search?type=page&limit=${limit}&start=${start}`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          pages: pages.results,
          metadata: createStandardMetadata(pages.size, pages.limit, pages.start, uri.href)
        }),
        schema: pageListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Danh sách trang
server.resource(
  "confluence-pages",
  new ResourceTemplate("confluence://pages", { list: undefined }),
  async (uri) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/pages${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const pages = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          pages: pages.results,
          metadata: {
            limit: limit,
            hasMore: !!pages._links.next,
            links: {
              self: uri.href,
              next: pages._links.next ? `${uri.href}?cursor=${new URL(pages._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: pageListSchemaV2
      }]
    };
  }
);
```

### 4. Page Details

**Từ v1:**
```typescript
// Chi tiết trang
server.resource(
  "confluence-page-details",
  new ResourceTemplate("confluence://pages/{pageId}", { pageId: undefined }),
  async (uri, { pageId }) => {
    const page = await confluenceClient.get(`/rest/api/content/${pageId}?expand=body.storage,version`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          ...page,
          body: page.body?.storage?.value || ""
        }),
        schema: pageSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Chi tiết trang
server.resource(
  "confluence-page-details",
  new ResourceTemplate("confluence://pages/{pageId}", { pageId: undefined }),
  async (uri, { pageId }) => {
    // Cần 2 API call riêng biệt thay vì dùng expand
    const page = await confluenceClient.get(`/wiki/api/v2/pages/${pageId}`);
    const body = await confluenceClient.get(`/wiki/api/v2/pages/${pageId}/body`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          ...page,
          body: body.value || "",
          bodyType: body.representation || "storage"
        }),
        schema: pageSchemaV2
      }]
    };
  }
);
```

### 5. Page Children

**Từ v1:**
```typescript
// Danh sách trang con
server.resource(
  "confluence-page-children",
  new ResourceTemplate("confluence://pages/{pageId}/children", { pageId: undefined }),
  async (uri, { pageId }) => {
    const children = await confluenceClient.get(`/rest/api/content/${pageId}/child/page`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          pages: children.results,
          metadata: createStandardMetadata(children.size, children.limit, children.start, uri.href)
        }),
        schema: pageListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Danh sách trang con
server.resource(
  "confluence-page-children",
  new ResourceTemplate("confluence://pages/{pageId}/children", { pageId: undefined }),
  async (uri, { pageId }) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/pages/${pageId}/children${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const children = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          pages: children.results,
          metadata: {
            limit: limit,
            hasMore: !!children._links.next,
            links: {
              self: uri.href,
              next: children._links.next ? `${uri.href}?cursor=${new URL(children._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: pageListSchemaV2
      }]
    };
  }
);
```

### 6. Page Ancestors

**Từ v1:**
```typescript
// Danh sách tổ tiên
server.resource(
  "confluence-page-ancestors",
  new ResourceTemplate("confluence://pages/{pageId}/ancestors", { pageId: undefined }),
  async (uri, { pageId }) => {
    const page = await confluenceClient.get(`/rest/api/content/${pageId}?expand=ancestors`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          ancestors: page.ancestors || [],
          metadata: createStandardMetadata(page.ancestors?.length || 0, page.ancestors?.length || 0, 0, uri.href)
        }),
        schema: pageListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Danh sách tổ tiên
server.resource(
  "confluence-page-ancestors",
  new ResourceTemplate("confluence://pages/{pageId}/ancestors", { pageId: undefined }),
  async (uri, { pageId }) => {
    const ancestors = await confluenceClient.get(`/wiki/api/v2/pages/${pageId}/ancestors`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          ancestors: ancestors.results,
          metadata: {
            total: ancestors.results.length,
            limit: ancestors.results.length,
            hasMore: false,
            links: {
              self: uri.href
            }
          }
        }),
        schema: pageListSchemaV2
      }]
    };
  }
);
```

### 7. Page Labels

**Từ v1:**
```typescript
// Nhãn của trang
server.resource(
  "confluence-page-labels",
  new ResourceTemplate("confluence://pages/{pageId}/labels", { pageId: undefined }),
  async (uri, { pageId }) => {
    const labels = await confluenceClient.get(`/rest/api/content/${pageId}/label`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          labels: labels.results,
          metadata: createStandardMetadata(labels.size, labels.limit, labels.start, uri.href)
        }),
        schema: labelListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Nhãn của trang
server.resource(
  "confluence-page-labels",
  new ResourceTemplate("confluence://pages/{pageId}/labels", { pageId: undefined }),
  async (uri, { pageId }) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/pages/${pageId}/labels${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const labels = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          labels: labels.results,
          metadata: {
            limit: limit,
            hasMore: !!labels._links.next,
            links: {
              self: uri.href,
              next: labels._links.next ? `${uri.href}?cursor=${new URL(labels._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: labelListSchemaV2
      }]
    };
  }
);
```

### 8. Page Attachments

**Từ v1:**
```typescript
// Tập tin đính kèm
server.resource(
  "confluence-page-attachments",
  new ResourceTemplate("confluence://pages/{pageId}/attachments", { pageId: undefined }),
  async (uri, { pageId }) => {
    const attachments = await confluenceClient.get(`/rest/api/content/${pageId}/child/attachment`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          attachments: attachments.results,
          metadata: createStandardMetadata(attachments.size, attachments.limit, attachments.start, uri.href)
        }),
        schema: attachmentListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Tập tin đính kèm
server.resource(
  "confluence-page-attachments",
  new ResourceTemplate("confluence://pages/{pageId}/attachments", { pageId: undefined }),
  async (uri, { pageId }) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/pages/${pageId}/attachments${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const attachments = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          attachments: attachments.results,
          metadata: {
            limit: limit,
            hasMore: !!attachments._links.next,
            links: {
              self: uri.href,
              next: attachments._links.next ? `${uri.href}?cursor=${new URL(attachments._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: attachmentListSchemaV2
      }]
    };
  }
);
```

### 9. Page Versions

**Từ v1:**
```typescript
// Lịch sử phiên bản
server.resource(
  "confluence-page-versions",
  new ResourceTemplate("confluence://pages/{pageId}/versions", { pageId: undefined }),
  async (uri, { pageId }) => {
    const versions = await confluenceClient.get(`/rest/api/content/${pageId}/version`);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          versions: versions.results,
          metadata: createStandardMetadata(versions.size, versions.limit, versions.start, uri.href)
        }),
        schema: versionListSchema
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Lịch sử phiên bản
server.resource(
  "confluence-page-versions",
  new ResourceTemplate("confluence://pages/{pageId}/versions", { pageId: undefined }),
  async (uri, { pageId }) => {
    const url = new URL(uri.href);
    const limit = parseInt(url.searchParams.get("limit") || "25");
    const cursor = url.searchParams.get("cursor") || undefined;
    
    const endpoint = `/wiki/api/v2/pages/${pageId}/versions${cursor ? `?cursor=${cursor}&limit=${limit}` : `?limit=${limit}`}`;
    const versions = await confluenceClient.get(endpoint);
    
    return {
      contents: [{
        uri: uri.href,
        mimeType: "application/json",
        text: JSON.stringify({
          versions: versions.results,
          metadata: {
            limit: limit,
            hasMore: !!versions._links.next,
            links: {
              self: uri.href,
              next: versions._links.next ? `${uri.href}?cursor=${new URL(versions._links.next).searchParams.get("cursor")}&limit=${limit}` : undefined
            }
          }
        }),
        schema: versionListSchemaV2
      }]
    };
  }
);
```

## Migration cho Tools

### 1. createPage

**Từ v1:**
```typescript
// Tạo trang mới
server.tool(
  "createPage",
  z.object({
    spaceKey: z.string().describe("Space key"),
    title: z.string().describe("Page title"),
    content: z.string().describe("Page content (HTML)"),
    parentId: z.string().optional().describe("Parent page ID")
  }),
  async (params) => {
    const payload = {
      type: "page",
      title: params.title,
      space: { key: params.spaceKey },
      body: {
        storage: {
          value: params.content,
          representation: "storage"
        }
      }
    };
    
    if (params.parentId) {
      payload.ancestors = [{ id: params.parentId }];
    }
    
    const response = await confluenceClient.post('/rest/api/content', payload);
    
    return {
      content: [{
        type: "text",
        text: `Page created successfully with ID: ${response.id}`
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Tạo trang mới
server.tool(
  "createPage",
  z.object({
    spaceKey: z.string().describe("Space key"),
    title: z.string().describe("Page title"),
    content: z.string().describe("Page content (HTML)"),
    parentId: z.string().optional().describe("Parent page ID")
  }),
  async (params) => {
    const payload = {
      spaceId: params.spaceKey,
      title: params.title,
      body: {
        representation: "storage",
        value: params.content
      }
    };
    
    if (params.parentId) {
      payload.parentId = params.parentId;
    }
    
    const response = await confluenceClient.post('/wiki/api/v2/pages', payload);
    
    return {
      content: [{
        type: "text",
        text: `Page created successfully with ID: ${response.id}`
      }]
    };
  }
);
```

### 2. updatePage

**Từ v1:**
```typescript
// Cập nhật trang
server.tool(
  "updatePage",
  z.object({
    pageId: z.string().describe("Page ID"),
    title: z.string().optional().describe("New page title"),
    content: z.string().optional().describe("New page content (HTML)"),
    version: z.number().describe("Current page version"),
    addLabels: z.array(z.string()).optional().describe("Labels to add"),
    removeLabels: z.array(z.string()).optional().describe("Labels to remove")
  }),
  async (params) => {
    // Get current page
    const currentPage = await confluenceClient.get(`/rest/api/content/${params.pageId}?expand=version`);
    
    // Update page content
    const payload = {
      type: "page",
      title: params.title || currentPage.title,
      version: {
        number: params.version + 1
      }
    };
    
    if (params.content) {
      payload.body = {
        storage: {
          value: params.content,
          representation: "storage"
        }
      };
    }
    
    const response = await confluenceClient.put(`/rest/api/content/${params.pageId}`, payload);
    
    // Add labels if specified
    if (params.addLabels && params.addLabels.length > 0) {
      const labelObjects = params.addLabels.map(label => ({ name: label }));
      await confluenceClient.post(`/rest/api/content/${params.pageId}/label`, labelObjects);
    }
    
    // Remove labels if specified
    if (params.removeLabels && params.removeLabels.length > 0) {
      for (const label of params.removeLabels) {
        await confluenceClient.delete(`/rest/api/content/${params.pageId}/label?name=${label}`);
      }
    }
    
    return {
      content: [{
        type: "text",
        text: `Page ${params.pageId} updated successfully to version ${response.version.number}`
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Cập nhật trang
server.tool(
  "updatePage",
  z.object({
    pageId: z.string().describe("Page ID"),
    title: z.string().optional().describe("New page title"),
    content: z.string().optional().describe("New page content (HTML)"),
    version: z.number().describe("Current page version"),
    addLabels: z.array(z.string()).optional().describe("Labels to add"),
    removeLabels: z.array(z.string()).optional().describe("Labels to remove")
  }),
  async (params) => {
    // Update page title if specified
    if (params.title) {
      await confluenceClient.put(`/wiki/api/v2/pages/${params.pageId}`, {
        id: params.pageId,
        status: "current",
        title: params.title,
        version: {
          number: params.version + 1
        }
      });
    }
    
    // Update page content if specified
    if (params.content) {
      await confluenceClient.put(`/wiki/api/v2/pages/${params.pageId}/body`, {
        representation: "storage",
        value: params.content,
        version: {
          number: params.version + (params.title ? 2 : 1)
        }
      });
    }
    
    // Add labels if specified
    if (params.addLabels && params.addLabels.length > 0) {
      const labelObjects = params.addLabels.map(label => ({ name: label }));
      await confluenceClient.post(`/wiki/api/v2/pages/${params.pageId}/labels`, labelObjects);
    }
    
    // Remove labels if specified
    if (params.removeLabels && params.removeLabels.length > 0) {
      for (const label of params.removeLabels) {
        await confluenceClient.delete(`/wiki/api/v2/pages/${params.pageId}/labels/${label}`);
      }
    }
    
    return {
      content: [{
        type: "text",
        text: `Page ${params.pageId} updated successfully`
      }]
    };
  }
);
```

### 3. addComment

**Từ v1:**
```typescript
// Thêm comment vào page
server.tool(
  "addComment",
  z.object({
    pageId: z.string().describe("Page ID"),
    content: z.string().describe("Comment content (HTML)")
  }),
  async (params) => {
    const payload = {
      type: "comment",
      container: {
        id: params.pageId,
        type: "page"
      },
      body: {
        storage: {
          value: params.content,
          representation: "storage"
        }
      }
    };
    
    const response = await confluenceClient.post('/rest/api/content', payload);
    
    return {
      content: [{
        type: "text",
        text: `Comment added successfully with ID: ${response.id}`
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Thêm comment vào page
server.tool(
  "addComment",
  z.object({
    pageId: z.string().describe("Page ID"),
    content: z.string().describe("Comment content (HTML)")
  }),
  async (params) => {
    const payload = {
      body: {
        representation: "storage",
        value: params.content
      }
    };
    
    const response = await confluenceClient.post(`/wiki/api/v2/pages/${params.pageId}/comments`, payload);
    
    return {
      content: [{
        type: "text",
        text: `Comment added successfully with ID: ${response.id}`
      }]
    };
  }
);
```

### 4. addLabelsToPage

**Từ v1:**
```typescript
// Thêm nhãn vào trang
server.tool(
  "addLabelsToPage",
  z.object({
    pageId: z.string().describe("Page ID"),
    labels: z.array(z.string()).describe("Labels to add")
  }),
  async (params) => {
    const labelObjects = params.labels.map(label => ({ name: label }));
    
    await confluenceClient.post(`/rest/api/content/${params.pageId}/label`, labelObjects);
    
    return {
      content: [{
        type: "text",
        text: `Labels added to page ${params.pageId} successfully`
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Thêm nhãn vào trang
server.tool(
  "addLabelsToPage",
  z.object({
    pageId: z.string().describe("Page ID"),
    labels: z.array(z.string()).describe("Labels to add")
  }),
  async (params) => {
    const labelObjects = params.labels.map(label => ({ name: label }));
    
    await confluenceClient.post(`/wiki/api/v2/pages/${params.pageId}/labels`, labelObjects);
    
    return {
      content: [{
        type: "text",
        text: `Labels added to page ${params.pageId} successfully`
      }]
    };
  }
);
```

### 5. removeLabelsFromPage

**Từ v1:**
```typescript
// Xóa nhãn khỏi trang
server.tool(
  "removeLabelsFromPage",
  z.object({
    pageId: z.string().describe("Page ID"),
    labels: z.array(z.string()).describe("Labels to remove")
  }),
  async (params) => {
    for (const label of params.labels) {
      await confluenceClient.delete(`/rest/api/content/${params.pageId}/label?name=${label}`);
    }
    
    return {
      content: [{
        type: "text",
        text: `Labels removed from page ${params.pageId} successfully`
      }]
    };
  }
);
```

**Sang v2:**
```typescript
// Xóa nhãn khỏi trang
server.tool(
  "removeLabelsFromPage",
  z.object({
    pageId: z.string().describe("Page ID"),
    labels: z.array(z.string()).describe("Labels to remove")
  }),
  async (params) => {
    for (const label of params.labels) {
      await confluenceClient.delete(`/wiki/api/v2/pages/${params.pageId}/labels/${label}`);
    }
    
    return {
      content: [{
        type: "text",
        text: `Labels removed from page ${params.pageId} successfully`
      }]
    };
  }
);
```

## Cập nhật Schema

Cần cập nhật các schema để phù hợp với cấu trúc dữ liệu mới từ API v2:

```typescript
// Schema cho Space v2
const spaceSchemaV2 = {
  type: "object",
  properties: {
    id: { type: "string", description: "Space ID" },
    key: { type: "string", description: "Space key" },
    name: { type: "string", description: "Space name" },
    type: { type: "string", description: "Space type" },
    status: { type: "string", description: "Space status" },
    description: { 
      type: "object", 
      properties: {
        plain: { type: "object", properties: { value: { type: "string" } } },
        view: { type: "object", properties: { value: { type: "string" } } }
      }
    },
    _links: { type: "object", description: "Links related to the space" }
  }
};

// Schema cho Page v2
const pageSchemaV2 = {
  type: "object",
  properties: {
    id: { type: "string", description: "Page ID" },
    title: { type: "string", description: "Page title" },
    status: { type: "string", description: "Page status" },
    spaceId: { type: "string", description: "Space ID" },
    parentId: { type: "string", description: "Parent page ID" },
    authorId: { type: "string", description: "Author ID" },
    createdAt: { type: "string", description: "Creation date" },
    version: { 
      type: "object", 
      properties: {
        number: { type: "number", description: "Version number" },
        createdAt: { type: "string", description: "Version creation date" }
      }
    },
    body: { type: "string", description: "Page content (converted from body object)" },
    bodyType: { type: "string", description: "Content representation type" },
    _links: { type: "object", description: "Links related to the page" }
  }
};

// Các schema khác cũng cần được cập nhật tương tự
```

## Lưu ý quan trọng

1. **Phân trang cursor-based**: API v2 sử dụng cursor-based pagination thay vì offset-based, nên cần thay đổi cách xử lý phân trang.

2. **Không có tham số expand**: Thay vì dùng `expand`, cần gọi các API riêng biệt (ví dụ: để lấy nội dung trang, cần gọi `/wiki/api/v2/pages/{id}/body`).

3. **Cấu trúc dữ liệu khác biệt**: Cấu trúc JSON trả về từ API v2 khác với v1, cần điều chỉnh schema và xử lý dữ liệu.

4. **Xử lý version**: Trong API v2, việc cập nhật title và body là các hoạt động riêng biệt, mỗi hoạt động tăng version number.

5. **Hiệu năng tốt hơn**: API v2 có hiệu năng tốt hơn đáng kể, đặc biệt với các tập dữ liệu lớn.

6. **Deadline migration**: Dựa vào kết quả tìm kiếm, nhiều endpoint v1 đã bị đánh dấu deprecated và sẽ bị loại bỏ. Vì hiện tại đã là tháng 5/2025, việc migration là cấp thiết.

Bằng cách tuân theo hướng dẫn này, bạn có thể chuyển đổi thành công các resource và tool Confluence trong MCP server từ API v1 sang API v2, đảm bảo tính tương thích lâu dài và tận dụng các cải tiến hiệu năng của API mới.

> **Lưu ý:** Từ tháng 5/2025, MCP Server chỉ hỗ trợ Confluence API v2. Nếu còn sử dụng API v1, bạn sẽ không thể truy cập resource/tool liên quan Confluence.