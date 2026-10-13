# CropMate AI — Nhật ký mùa vụ và trợ lý canh tác

Frontend prototype cho học phần **Phát triển ứng dụng Web cơ bản (CSE122)**.
Công nghệ: HTML5, CSS3, JavaScript thuần, JSON seed, LocalStorage/SessionStorage. Không cần Backend, không cần build.

## Chạy thử
Mở `index.html` bằng trình duyệt (hoặc dùng Live Server / `python3 -m http.server`). Chọn tài khoản demo ở `login.html`.

| Vai trò | Email | Mật khẩu | Trang đích |
|---|---|---|---|
| Nông dân | farmer@cropmate.vn | Farmer@123 | farmer-season-dashboard.html |
| Nông dân 2 | farmer2@cropmate.vn | Farmer@123 | farmer-season-dashboard.html |
| Chuyên gia | expert@cropmate.vn | Expert@123 | expert-request-queue.html |
| Điều phối HTX | coordinator@cropmate.vn | Coord@123 | coordinator-farm-overview.html |
| Quản trị viên | admin@cropmate.vn | Admin@123 | admin-dashboard.html |
| Bị vô hiệu hóa | tam.le@cropmate.vn | Farmer@123 | (bị chặn đăng nhập) |

Admin có nút **Đặt lại dữ liệu demo** ở dashboard.

## Luồng nghiệp vụ xuyên role (nên demo)
1. Farmer: Nhật ký canh tác → thêm nhật ký.
2. Farmer: Yêu cầu hỗ trợ → tạo yêu cầu, dùng AI-1 phân loại, gửi.
3. Expert: yêu cầu xuất hiện trong hàng chờ (có thông báo) → Nhận xử lý → xem nhật ký liên quan → AI-3 tóm tắt → gửi phản hồi.
4. Farmer: thấy phản hồi và trạng thái mới (có thông báo).
5. Coordinator: thấy yêu cầu, việc trễ hạn, tiến độ trong Tổng quan nông hộ, Lịch và Tổng kết.
6. Admin: vô hiệu hóa tài khoản → tài khoản đó không đăng nhập được.

## Ba tính năng AI (MÔ PHỎNG)
Viết bằng JavaScript rule-based trong `js/ai.js`, **không gọi LLM/API thật**; giao diện ghi rõ "AI mô phỏng".
- **AI-1** Field Issue Classifier — `farmer-help-request.html`
- **AI-2** Season Checklist Generator — `farmer-checklist.html`
- **AI-3** Farm Log Summarizer — `expert-request-detail.html`

Cả ba dùng chung luồng: nhập → validation → đang xử lý → kết quả + giải thích → chấp nhận / chỉnh sửa / từ chối / tạo lại → lưu. Có trạng thái *không đủ dữ liệu*, *chưa chắc chắn*, *lỗi* (bật ô "Mô phỏng lỗi hệ thống" để demo). Ảnh chỉ được ghi nhận là có đính kèm, không được phân tích.

## Cấu trúc
```
index.html login.html register.html forgot-password.html
pages/{farmer,expert,coordinator,admin,shared}/
css/ style.css (token, layout) · components.css · responsive.css
js/  data/seed.js (dữ liệu khởi tạo tập trung) · storage.js (CRUD, LocalStorage)
     auth.js (phiên, guard role) · ui.js (shell, modal, form, AI panel) · ai.js (AI mô phỏng)
     modules/  một file cho mỗi trang
docs/ design/
```
Dữ liệu: `users, farms, fields, crops, seasons, fieldLogs, helpRequests, resources, checklists, calendarEvents, seasonSummaries, notifications`. Mọi thao tác tạo/sửa/xóa đi qua `CM.store` và được lưu trong LocalStorage (khóa `cropmate.v1.*`).

## Lưu ý
- Xác thực là **mô phỏng Frontend**, mật khẩu demo lưu trong LocalStorage, không có bảo mật như Backend thật.
- Ảnh được nén ≤ 720px và lưu dạng dataURL; LocalStorage có giới hạn dung lượng (~5 MB).
- Font Be Vietnam Pro tải từ Google Fonts, có font dự phòng khi offline.
- Chưa có Figma/Canva, Trello, GitHub PR, video OBS: nhóm cần tự bổ sung theo `docs/team-assignment.md`.

## Quy ước Git
Nhánh `main`, `dev`, `feature/*`, `fix/*`, `docs/*`. Commit dạng `feat:`, `fix:`, `style:`, `docs:`.
