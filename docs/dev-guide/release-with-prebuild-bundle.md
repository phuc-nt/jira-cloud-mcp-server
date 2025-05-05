Dưới đây là hướng dẫn đầy đủ, từng bước để tạo một **GitHub Release** cho MCP server, cho phép người dùng chỉ cần “tải về là chạy”, bằng cách đính kèm cả thư mục `dist/` và `node_modules/` vào file nén release (không cần commit hai thư mục này vào repo):

---

## 1. Build project và cài dependency

```bash
git clone https://github.com/phuc-nt/mcp-atlassian-server.git
cd mcp-atlassian-server
npm install
npm run build
```
Sau khi chạy xong, bạn sẽ có hai thư mục:  
- `dist/` (chứa mã đã build)
- `node_modules/` (chứa toàn bộ dependency)

---

## 2. Đóng gói file nén chứa dist và node_modules

```bash
# Đảm bảo đang ở thư mục gốc của project
zip -r mcp-atlassian-server-bundle.zip dist node_modules package.json package-lock.json README.md llms-install.md
```
- Có thể thêm các file hướng dẫn hoặc config cần thiết khác nếu muốn.

---

## 3. Tạo Release trên GitHub

1. **Vào trang repo → Releases → Draft a new release**
2. Chọn tag version (ví dụ: `v1.0.0`), điền tiêu đề & mô tả release.
3. **Kéo file `mcp-atlassian-server-bundle.zip` vào phần “Attach binaries by dropping them here or selecting them”**.
4. Mô tả rõ trong phần Release note:  
   - “Download the bundle, extract, and run with Node.js. No need to install dependencies or build.”
   - Hướng dẫn người dùng giải nén và trỏ Cline tới file `dist/index.js` trong thư mục vừa giải nén.

---

## 4. Hướng dẫn sử dụng cho người dùng

**Sau khi tải về:**
```bash
unzip mcp-atlassian-server-bundle.zip
cd mcp-atlassian-server-bundle
# (hoặc cd vào thư mục vừa giải nén)
node dist/index.js
```
- Khi cấu hình Cline, trỏ `"args"` vào file `dist/index.js` trong thư mục này.
- Không cần chạy `npm install` hay `npm run build` nữa.

---

## 5. Lưu ý về best practice

- **Không commit `dist/` và `node_modules/` vào repo** (giữ nguyên `.gitignore`).
- Chỉ upload bản build lên Release (xem thêm StackOverflow[1][3][5]).
- Nếu muốn tự động hóa, có thể dùng GitHub Actions để build và upload bundle vào Release (tham khảo ví dụ ở[2][4]).
- Nếu bundle quá lớn, có thể cân nhắc chỉ upload `dist/` và hướng dẫn người dùng chạy `npm install` (nhưng như vậy không còn “tải về là chạy”).

---

### **Tóm tắt các file nên đính kèm trong Release:**
- `mcp-atlassian-server-bundle.zip` (chứa: `dist/`, `node_modules/`, `package.json`, `package-lock.json`, `README.md`, `llms-install.md`)
- Release note hướng dẫn giải nén và chạy trực tiếp

---

**Tham khảo:**  
- [Stack Overflow: How to save dist/build files on Github Release but not in master][1]  
- [Pluralsight: Set Up a GitHub Project with node_module][3]  
- [Reddit: How to add node_modules folder to github repository?][5]  
- [GitHub Actions example][2][4]

---

**Tóm lại:**  
Bạn chỉ cần build, đóng gói dist + node_modules + file hướng dẫn vào một file zip, upload lên Release, và hướng dẫn người dùng giải nén, chạy trực tiếp với Node.js hoặc cấu hình Cline trỏ vào file `dist/index.js` trong thư mục vừa giải nén là xong.

---[1]: https://stackoverflow.com/questions/50974474/how-to-save-dist-build-files-on-github-release-but-not-in-master[2]: https://github.com/orgs/community/discussions/64973[3]: https://www.pluralsight.com/resources/blog/guides/set-up-a-github-project-with-node-module[4]: https://cardinalby.github.io/blog/post/github-actions/js-action-packing-and-releasing/[5]: https://www.reddit.com/r/github/comments/1au739l/how_to_add_node_modules_folder_to_github/
