#!/bin/bash

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Banner
echo -e "${BLUE}"
echo "====================================================="
echo "      MCP Atlassian Server Docker Manager"
echo "====================================================="
echo -e "${NC}"

# Kiểm tra xem file .env tồn tại
if [ ! -f .env ]; then
  echo -e "${RED}Lỗi: File .env không tồn tại.${NC}"
  echo "Vui lòng tạo file .env với các biến môi trường sau:"
  echo "ATLASSIAN_SITE_NAME=your-site.atlassian.net"
  echo "ATLASSIAN_USER_EMAIL=your-email@example.com"
  echo "ATLASSIAN_API_TOKEN=your-api-token"
  exit 1
fi

# Hiển thị menu
echo -e "${YELLOW}Chọn chế độ quản lý MCP Server:${NC}"
echo "1. Chạy MCP Server (với STDIO Transport)"
echo "2. Dừng và xóa container"
echo "3. Xem logs của container"
echo "4. Hiển thị cấu hình Cline"
echo "5. Thoát"
echo ""

read -p "Nhập lựa chọn của bạn (1-5): " choice

case $choice in
  1)
    echo -e "${GREEN}Chạy MCP Server với STDIO Transport...${NC}"
    docker compose up --build -d mcp-atlassian
    echo -e "${GREEN}MCP Server đã được khởi động với STDIO transport.${NC}"
    echo -e "${YELLOW}Hướng dẫn cấu hình Cline:${NC}"
    echo "1. Mở Cline trong VS Code"
    echo "2. Đi đến cấu hình MCP Servers"
    echo "3. Thêm cấu hình sau vào file cline_mcp_settings.json:"
    echo ""
    echo '{
  "mcpServers": {
    "atlassian-docker": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-atlassian", "node", "dist/index.js"],
      "env": {}
    }
  }
}'
    ;;
  2)
    echo -e "${YELLOW}Dừng và xóa container hiện tại...${NC}"
    docker compose down
    echo -e "${GREEN}Đã dừng và xóa các container MCP Server.${NC}"
    ;;
  3)
    echo -e "${YELLOW}Container đang chạy:${NC}"
    docker ps --filter "name=mcp-atlassian"
    echo ""
    echo -e "${GREEN}Hiển thị logs của container mcp-atlassian...${NC}"
    docker logs -f mcp-atlassian
    ;;
  4)
    echo -e "${GREEN}Cấu hình Cline để kết nối với MCP Server:${NC}"
    echo '{
  "mcpServers": {
    "atlassian-docker": {
      "command": "docker",
      "args": ["exec", "-i", "mcp-atlassian", "node", "dist/index.js"],
      "env": {}
    }
  }
}'
    ;;
  5)
    echo -e "${GREEN}Thoát chương trình.${NC}"
    exit 0
    ;;
  *)
    echo -e "${RED}Lựa chọn không hợp lệ.${NC}"
    exit 1
    ;;
esac 