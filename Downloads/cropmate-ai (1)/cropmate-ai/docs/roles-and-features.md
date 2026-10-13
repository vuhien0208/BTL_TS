# Vai trò và chức năng
Xem `README.md` (luồng demo) và `docs/screen-list.md`. Quyền được chặn ở `CM.auth.guard(role)`: chưa đăng nhập → `login.html`; sai role → `pages/shared/403.html`. Menu chỉ hiển thị mục của role hiện tại (`js/ui.js`, hằng `NAV`).

## Quan hệ dữ liệu
users → farms → fields → seasons → fieldLogs / checklists / helpRequests; resources, calendarEvents, seasonSummaries, notifications tham chiếu seasons/farms/users.
