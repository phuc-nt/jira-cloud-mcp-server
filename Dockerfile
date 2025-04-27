FROM node:18-slim

WORKDIR /app

# Sao chép các file cấu hình
COPY package*.json ./
COPY tsconfig.json ./

# Cài đặt các phụ thuộc
RUN npm ci

# Sao chép mã nguồn
COPY src ./src

# Build TypeScript thành JavaScript
RUN npm run build

# Mở port mặc định cho SSE transport (sẽ cập nhật sau)
EXPOSE 8080

# Biến môi trường mặc định
ENV NODE_ENV=production

# Khởi động MCP Server sử dụng STDIO transport
# Lưu ý: Sẽ cập nhật để hỗ trợ SSE transport sau
CMD ["node", "dist/index.js"] 