(function () {
  const CM = window.CM, U = CM.ui, S = CM.store;
  const page = document.body.dataset.page;

  /* ---------- 403 / 404 ---------- */
  if (page === '403' || page === '404') {
    const u = CM.auth.current();
    const a = U.qs('#back-link');
    if (a) { a.href = u ? CM.auth.homeFor(u.role) : CM.root + 'login.html'; a.textContent = u ? 'Về trang của tôi' : 'Về trang đăng nhập'; }
    return;
  }

  const me = CM.auth.guard(null);
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');

  /* ---------- Hồ sơ ---------- */
  if (page === 'profile') {
    function render() {
      const u = S.find('users', me.id), farm = u.role === 'farmer' ? CM.q.farmsOf(u.id)[0] : null;
      view.innerHTML =
        '<div class="page-head"><div><h2>Hồ sơ cá nhân</h2><p>Cập nhật thông tin liên hệ và mật khẩu của bạn.</p></div></div><div class="grid grid-2" style="align-items:start">' +
        '<section class="card" aria-labelledby="h-info"><div class="card-head"><h2 id="h-info">Thông tin cá nhân</h2>' + U.badge('info', U.ROLE_LABEL[u.role]) + '</div><div class="card-body"><form id="pf" novalidate>' +
        U.field({ name: 'name', label: 'Họ và tên', required: true, value: u.name }) + U.field({ name: 'email', label: 'Email đăng nhập', type: 'email', value: u.email, disabled: true, help: 'Liên hệ quản trị viên để đổi email.' }) +
        U.field({ name: 'phone', label: 'Số điện thoại', type: 'tel', value: u.phone }) +
        (farm ? U.field({ name: 'farmName', label: 'Tên nông hộ', value: farm.name }) + U.field({ name: 'address', label: 'Địa chỉ nông hộ', value: farm.address }) : '') +
        '<button class="btn" type="submit">Lưu thay đổi</button></form></div></section>' +
        '<section class="card" aria-labelledby="h-pw"><div class="card-head"><h2 id="h-pw">Đổi mật khẩu</h2></div><div class="card-body"><form id="pwf" novalidate autocomplete="off">' +
        U.field({ name: 'current', label: 'Mật khẩu hiện tại', type: 'password', required: true }) + U.field({ name: 'next', label: 'Mật khẩu mới', type: 'password', required: true, autocomplete: 'new-password', help: 'Tối thiểu 8 ký tự, gồm chữ và số.' }) + U.field({ name: 'again', label: 'Nhập lại mật khẩu mới', type: 'password', required: true, autocomplete: 'new-password' }) +
        '<button class="btn" type="submit">Đổi mật khẩu</button></form></div></section></div>';

      const pf = U.qs('#pf', view); U.clearErrorsOnInput(pf);
      pf.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!U.validate(pf, { name: { label: 'Họ tên', required: true, min: 2, max: 60 }, phone: { label: 'Số điện thoại', pattern: /^(0|\+84)\d{8,10}$/, patternMsg: 'Số điện thoại chưa hợp lệ, ví dụ 0912345678.' } })) return;
        const d = U.formData(pf);
        S.update('users', u.id, { name: d.name, phone: d.phone });
        if (farm) S.update('farms', farm.id, { name: d.farmName || farm.name, address: d.address || '' });
        U.toast('Đã lưu hồ sơ.'); U.mountShell(CM.auth.current()); render();
      });
      const pw = U.qs('#pwf', view); U.clearErrorsOnInput(pw);
      pw.addEventListener('submit', (e) => {
        e.preventDefault();
        if (!U.validate(pw, {
          current: { label: 'Mật khẩu hiện tại', required: true, custom: (v) => (v !== S.find('users', me.id).password ? 'Mật khẩu hiện tại không đúng.' : '') },
          next: { label: 'Mật khẩu mới', required: true, custom: (v) => CM.auth.passwordProblem(v) || (v === pw.elements.current.value ? 'Mật khẩu mới cần khác mật khẩu hiện tại.' : '') },
          again: { label: 'Nhập lại mật khẩu', required: true, custom: (v) => (v !== pw.elements.next.value ? 'Mật khẩu nhập lại chưa khớp.' : '') },
        })) return;
        S.update('users', me.id, { password: pw.elements.next.value });
        pw.reset(); U.toast('Đã đổi mật khẩu.');
      });
    }
    U.withLoading(view, render);
  }

  /* ---------- Thông báo ---------- */
  if (page === 'notifications') {
    function render() {
      const list = S.notificationsFor(me), unread = list.filter((n) => !(n.readBy || []).includes(me.id));
      view.innerHTML = '<div class="page-head"><div><h2>Thông báo</h2><p>' + (unread.length ? 'Bạn có ' + unread.length + ' thông báo chưa đọc.' : 'Bạn đã đọc hết thông báo.') + '</p></div>' + (unread.length ? '<button class="btn btn-outline" data-all>' + U.icon('check') + ' Đánh dấu đã đọc tất cả</button>' : '') + '</div>' +
        '<div class="card">' + (list.length ? '<ul class="list">' + list.map((n) => {
          const isNew = !(n.readBy || []).includes(me.id);
          return '<li style="' + (isNew ? 'background:var(--field-50)' : '') + '"><div><strong>' + U.esc(n.title) + '</strong>' + (isNew ? ' ' + U.badge('info', 'Mới') : '') + '<p class="small">' + U.esc(n.text) + '</p><p class="small muted">' + U.fmtDateTime(n.date) + '</p></div><div class="row">' + (n.link ? '<a class="btn btn-sm btn-outline" href="' + CM.root + U.esc(n.link) + '" data-read="' + n.id + '">Mở</a>' : '') + (isNew ? '<button class="btn btn-sm btn-ghost" data-read-only="' + n.id + '">Đã đọc</button>' : '') + '</div></li>';
        }).join('') + '</ul>' : U.empty('bell', 'Chưa có thông báo', 'Thông báo về yêu cầu, lịch và tài khoản sẽ hiển thị tại đây.')) + '</div>';
    }
    function markRead(id) { const n = S.find('notifications', id); if (n && !(n.readBy || []).includes(me.id)) S.update('notifications', id, { readBy: (n.readBy || []).concat([me.id]) }); }
    view.addEventListener('click', (e) => {
      const a = e.target.closest('[data-read]'); if (a) { markRead(a.dataset.read); return; }
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.readOnly) { markRead(b.dataset.readOnly); render(); U.mountShell(me); }
      if (b.hasAttribute('data-all')) { S.notificationsFor(me).forEach((n) => markRead(n.id)); U.toast('Đã đánh dấu tất cả là đã đọc.'); render(); U.mountShell(me); }
    });
    U.withLoading(view, render);
  }
})();
