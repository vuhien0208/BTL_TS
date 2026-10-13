(function () {
  const CM = window.CM, U = CM.ui, S = CM.store;
  const me = CM.auth.guard('admin');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', role: '', status: '' };

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Quản lý tài khoản</h2><p>Tạo, sửa và vô hiệu hóa tài khoản. Tài khoản bị vô hiệu hóa không thể đăng nhập.</p></div><button class="btn" data-new>' + U.icon('plus') + ' Tạo tài khoản</button></div>' +
      '<div class="card"><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm tài khoản</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Họ tên, email, số điện thoại…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-role">Vai trò</label><select id="flt-role">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(CM.ROLES), state.role) + '</select></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Vô hiệu hóa' }], state.status) + '</select></div></div><div id="list"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-role', view).addEventListener('change', (e) => { state.role = e.target.value; list(); });
    U.qs('#flt-st', view).addEventListener('change', (e) => { state.status = e.target.value; list(); });
    list();
  }

  function list() {
    const q = U.norm(state.q), box = U.qs('#list', view);
    const rows = S.all('users').filter((u) => !state.role || u.role === state.role).filter((u) => !state.status || u.status === state.status).filter((u) => !q || U.norm(u.name + ' ' + u.email + ' ' + (u.phone || '')).includes(q));
    if (!rows.length) { box.innerHTML = U.empty('users', 'Không tìm thấy tài khoản', 'Thử đổi từ khóa hoặc bộ lọc.'); return; }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách tài khoản</caption><thead><tr><th>Họ tên</th><th>Email</th><th>Vai trò</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>' + rows.map((u) =>
      '<tr><td><strong>' + U.esc(u.name) + '</strong>' + (u.id === me.id ? ' <span class="small muted">(bạn)</span>' : '') + '<span class="sub">' + U.esc(u.phone || '') + '</span></td><td>' + U.esc(u.email) + '</td><td>' + U.esc(U.ROLE_LABEL[u.role]) + '</td><td>' + U.mapBadge(U.ACCOUNT_STATUS, u.status) + '</td><td>' + U.fmtDate(u.createdAt) + '</td>' +
      '<td><div class="actions"><button class="btn btn-sm btn-outline" data-edit="' + u.id + '">' + U.icon('edit') + ' Sửa</button>' + (u.id === me.id ? '' : '<button class="btn btn-sm btn-ghost" data-toggle="' + u.id + '">' + (u.status === 'active' ? 'Vô hiệu hóa' : 'Kích hoạt lại') + '</button>') + '</div></td></tr>').join('') + '</tbody></table></div><p class="small muted" style="padding:10px 20px">Hiển thị ' + rows.length + ' tài khoản.</p>';
  }

  function form(u) {
    const self = u && u.id === me.id;
    const m = U.openModal({
      title: u ? 'Sửa tài khoản' : 'Tạo tài khoản',
      body: '<form id="uf" novalidate autocomplete="off"><div class="form-grid">' +
        U.field({ name: 'name', label: 'Họ và tên', required: true, value: u ? u.name : '', full: true }) +
        U.field({ name: 'email', label: 'Email', type: 'email', required: true, value: u ? u.email : '', full: true }) +
        U.field({ name: 'phone', label: 'Số điện thoại', type: 'tel', value: u ? u.phone : '' }) +
        U.field({ name: 'role', label: 'Vai trò', type: 'select', options: CM.ROLES, value: u ? u.role : 'farmer', disabled: self, help: self ? 'Không thể đổi vai trò của chính bạn.' : '' }) +
        U.field({ name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'active', label: 'Hoạt động' }, { value: 'inactive', label: 'Vô hiệu hóa' }], value: u ? u.status : 'active', disabled: self }) +
        U.field({ name: 'password', label: u ? 'Mật khẩu mới' : 'Mật khẩu', type: 'password', required: !u, autocomplete: 'new-password', help: (u ? 'Để trống nếu không đổi. ' : '') + 'Tối thiểu 8 ký tự, gồm chữ và số.' }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="uf" type="submit">' + (u ? 'Lưu thay đổi' : 'Tạo tài khoản') + '</button>',
    });
    const f = U.qs('#uf', m.el); U.clearErrorsOnInput(f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(f, {
        name: { label: 'Họ tên', required: true, min: 2, max: 60 },
        email: { label: 'Email', required: true, pattern: CM.auth.EMAIL_RE, patternMsg: 'Email chưa đúng định dạng.', custom: (v) => (S.all('users').some((x) => x.email.toLowerCase() === v.toLowerCase() && (!u || x.id !== u.id)) ? 'Email này đã được sử dụng.' : '') },
        phone: { label: 'Số điện thoại', pattern: /^(0|\+84)\d{8,10}$/, patternMsg: 'Số điện thoại chưa hợp lệ, ví dụ 0912345678.' },
        password: { label: 'Mật khẩu', required: !u, custom: (v) => (v ? CM.auth.passwordProblem(v) : '') },
      });
      if (!ok) return;
      const d = U.formData(f);
      const rec = { name: d.name, email: d.email.toLowerCase(), phone: d.phone, role: self ? u.role : d.role, status: self ? u.status : d.status };
      if (d.password) rec.password = d.password;
      let saved;
      if (u) saved = S.update('users', u.id, rec);
      else saved = S.create('users', Object.assign({ createdAt: CM.today() }, rec, { password: d.password }));
      if (saved && saved.role === 'farmer' && !CM.q.farmsOf(saved.id).length) S.create('farms', { ownerId: saved.id, name: 'Nông hộ ' + saved.name, address: '', status: 'active' });
      m.close(); U.toast(u ? 'Đã cập nhật tài khoản.' : 'Đã tạo tài khoản.'); list();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) form(null);
    else if (t.dataset.edit) form(S.find('users', t.dataset.edit));
    else if (t.dataset.toggle) {
      const u = S.find('users', t.dataset.toggle), off = u.status === 'active';
      if (await U.confirm({ title: off ? 'Vô hiệu hóa tài khoản' : 'Kích hoạt lại tài khoản', message: off ? u.name + ' sẽ không thể đăng nhập cho đến khi được kích hoạt lại.' : u.name + ' sẽ có thể đăng nhập trở lại.', confirmText: off ? 'Vô hiệu hóa' : 'Kích hoạt', danger: off })) {
        S.update('users', u.id, { status: off ? 'inactive' : 'active' }); U.toast(off ? 'Đã vô hiệu hóa tài khoản.' : 'Đã kích hoạt lại tài khoản.'); list();
      }
    }
  });

  U.withLoading(view, shell);
})();
