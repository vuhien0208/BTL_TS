(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('admin');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');

  function render() {
    const users = S.all('users'), crops = S.all('crops'), reqs = S.all('helpRequests');
    const inactive = users.filter((u) => u.status !== 'active');
    const recent = users.slice().sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1)).slice(0, 5);
    view.innerHTML =
      '<div class="page-head"><div><h2>Tổng quan hệ thống</h2><p>Số liệu tài khoản, danh mục và hoạt động trên toàn bộ CropMate AI.</p></div><div class="row"><a class="btn btn-outline" href="admin-crop-management.html">' + U.icon('sprout') + ' Danh mục cây trồng</a><a class="btn" href="admin-user-management.html">' + U.icon('users') + ' Quản lý tài khoản</a></div></div>' +
      '<div class="grid grid-4" role="list"><div class="card stat" role="listitem"><span class="num">' + users.length + '</span><span class="lbl">Tài khoản</span></div>' +
      '<div class="card stat info" role="listitem"><span class="num">' + (users.length - inactive.length) + '</span><span class="lbl">Đang hoạt động</span></div>' +
      '<div class="card stat ' + (inactive.length ? 'danger' : '') + '" role="listitem"><span class="num">' + inactive.length + '</span><span class="lbl">Bị vô hiệu hóa</span></div>' +
      '<div class="card stat warn" role="listitem"><span class="num">' + crops.filter((c) => c.status === 'active').length + '/' + crops.length + '</span><span class="lbl">Cây trồng đang áp dụng</span></div></div>' +
      '<div class="grid grid-2" style="margin-top:20px"><section class="card" aria-labelledby="h-role"><div class="card-head"><h2 id="h-role">Tài khoản theo vai trò</h2></div><div class="card-body">' + U.bars(CM.ROLES.map((r) => ({ label: r.label, value: users.filter((u) => u.role === r.value).length }))) + '</div></section>' +
      '<section class="card" aria-labelledby="h-req"><div class="card-head"><h2 id="h-req">Yêu cầu hỗ trợ</h2></div><div class="card-body">' + U.bars(Object.keys(U.REQ_STATUS).map((k) => ({ label: U.REQ_STATUS[k][1], value: reqs.filter((r) => r.status === k).length }))) + '</div></section></div>' +
      '<section class="card" style="margin-top:20px" aria-labelledby="h-new"><div class="card-head"><h2 id="h-new">Tài khoản mới nhất</h2><a class="small" href="admin-user-management.html">Xem tất cả</a></div><div class="table-wrap"><table class="data"><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th></tr></thead><tbody>' +
      recent.map((u) => '<tr><td><strong>' + U.esc(u.name) + '</strong></td><td>' + U.esc(u.email) + '</td><td>' + U.esc(U.ROLE_LABEL[u.role]) + '</td><td>' + U.mapBadge(U.ACCOUNT_STATUS, u.status) + '</td><td>' + U.fmtDate(u.createdAt) + '</td></tr>').join('') + '</tbody></table></div></section>' +
      '<section class="card card-pad" style="margin-top:20px"><div class="row spread"><div><h3>Dữ liệu demo</h3><p class="small muted">Đặt lại toàn bộ dữ liệu về trạng thái ban đầu. Mọi thay đổi của tất cả vai trò sẽ mất.</p></div><button class="btn btn-outline" data-reset>' + U.icon('refresh') + ' Đặt lại dữ liệu demo</button></div></section>';
  }

  view.addEventListener('click', async (e) => {
    if (!e.target.closest('[data-reset]')) return;
    if (await U.confirm({ title: 'Đặt lại dữ liệu demo', message: 'Toàn bộ dữ liệu sẽ trở về ban đầu và bạn sẽ phải đăng nhập lại. Tiếp tục?', confirmText: 'Đặt lại', danger: true })) { CM.store.reset(); CM.auth.logout(); }
  });

  U.withLoading(view, render);
})();
