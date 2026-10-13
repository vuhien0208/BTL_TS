# Screen inventory

| # | Tệp | Role | Mục đích | Có thể có video OBS riêng |
|---|---|---|---|---|
| 1 | index.html | Công khai | Giới thiệu | ✔ |
| 2 | login.html | Công khai | Đăng nhập, kiểm tra trạng thái tài khoản, điều hướng theo role | ✔ |
| 3 | register.html | Công khai | Đăng ký Nông dân | ✔ |
| 4 | forgot-password.html | Công khai | Quên mật khẩu (mô phỏng) | ✔ |
| 5 | farmer-season-dashboard.html | Farmer | Dashboard mùa vụ | ✔ |
| 6 | farmer-seasons.html | Farmer | CRUD mùa vụ và thửa ruộng (bổ sung) | ✔ |
| 7 | farmer-field-log.html | Farmer | CRUD nhật ký, tìm kiếm, lọc | ✔ |
| 8 | farmer-checklist.html | Farmer | Checklist + **AI-2** (bổ sung) | ✔ |
| 9 | farmer-help-request.html | Farmer | Yêu cầu hỗ trợ + **AI-1** | ✔ |
| 10 | expert-request-queue.html | Expert | Hàng chờ, nhận xử lý | ✔ |
| 11 | expert-request-detail.html | Expert | Chi tiết, phản hồi + **AI-3** | ✔ |
| 12 | expert-resource-library.html | Expert | CRUD tài nguyên | ✔ |
| 13 | coordinator-farm-overview.html | Coordinator | Tổng quan nông hộ | ✔ |
| 14 | coordinator-calendar.html | Coordinator | Lịch hoạt động, CRUD sự kiện | ✔ |
| 15 | coordinator-season-summary.html | Coordinator | CRUD báo cáo tổng kết | ✔ |
| 16 | admin-dashboard.html | Admin | Tổng quan hệ thống | ✔ |
| 17 | admin-user-management.html | Admin | CRUD tài khoản, vô hiệu hóa | ✔ |
| 18 | admin-crop-management.html | Admin | CRUD danh mục cây trồng | ✔ |
| 19 | pages/shared/profile.html | Mọi role | Hồ sơ, đổi mật khẩu | ✔ |
| 20 | pages/shared/notifications.html | Mọi role | Thông báo | ✔ |
| 21 | pages/shared/403.html, 404.html | Mọi role | Trang lỗi | gộp chung |

Không tạo `settings.html` vì chưa có nghiệp vụ cần thiết. `farmer-seasons` và `farmer-checklist` được thêm vì nghiệp vụ cần mùa vụ và checklist để AI-2/AI-3 và Coordinator hoạt động.

## Sitemap
```
index → login → (role) → dashboard
  Farmer:      dashboard · mùa vụ & thửa · nhật ký · checklist(AI-2) · yêu cầu(AI-1)
  Expert:      hàng chờ → chi tiết(AI-3) · thư viện
  Coordinator: tổng quan nông hộ · lịch · tổng kết
  Admin:       dashboard · tài khoản · cây trồng      (nhánh ngang hàng)
  Chung:       hồ sơ · thông báo · 403 · 404
```
