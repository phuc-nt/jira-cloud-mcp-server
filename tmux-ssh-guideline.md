# Hướng dẫn sử dụng tmux và SSH trên Mac

## Mục đích
Hướng dẫn này giúp bạn thiết lập remote SSH để điều khiển Claude trên macOS từ iPhone. Bạn có thể khởi tạo session tmux, chạy các tác vụ dài hạn, và truy cập lại mọi lúc từ thiết bị di động mà không bị gián đoạn.

## 1. Khởi tạo session tmux
```bash
tmux new-session -s ten_session
```
Ví dụ: `tmux new-session -s claude-session`

## 2. Detach khỏi session
- Nhấn `Ctrl+b`, sau đó nhấn `d`

## 3. Attach lại vào session
```bash
tmux attach -t ten_session
```

## 4. List các session đang chạy
```bash
tmux ls
```

## 5. Kill (xóa) một session
```bash
tmux kill-session -t ten_session
```

## 6. Kết nối SSH từ thiết bị khác (ví dụ iPhone)
```bash
ssh username@mac-ip-address
```
- Thay `username` bằng tên user trên Mac
- Thay `mac-ip-address` bằng địa chỉ IP của Mac

## 7. Một số thao tác tmux cơ bản
- Tạo window mới: `Ctrl+b`, sau đó `c`
- Chuyển window: `Ctrl+b`, sau đó `n` (next) hoặc `p` (previous)
- Split pane ngang: `Ctrl+b`, sau đó `"`
- Split pane dọc: `Ctrl+b`, sau đó `%`

---
**Lưu ý:**
- Session tmux vẫn chạy khi mất kết nối SSH.
- Có thể attach lại bất cứ lúc nào để tiếp tục công việc.
