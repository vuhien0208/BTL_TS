(function () {
  const CM = window.CM, U = CM.ui, S = CM.store;
  const page = document.body.dataset.page;

  /* ---------- Đăng nhập ---------- */
  if (page === 'login') {
    const cur = CM.auth.current();
    if (cur && !U.param('out')) { location.replace(CM.auth.homeFor(cur.role)); return; }
    const form = U.qs('#login-form'), alertBox = U.qs('#login-alert');
    U.clearErrorsOnInput(form);
    if (U.param('expired')) showAlert('warn', 'Bạn cần đăng nhập để tiếp tục.');
    if (U.param('out')) showAlert('ok', 'Bạn đã đăng xuất.');
    function showAlert(kind, msg) { alertBox.innerHTML = '<div class="alert ' + kind + '" role="alert">' + U.icon('alert') + '<div>' + U.esc(msg) + '</div></div>'; }

    U.qsa('[data-demo]').forEach((b) => b.addEventListener('click', () => {
      form.elements.email.value = b.dataset.demo; form.elements.password.value = b.dataset.pw;
      ['email', 'password'].forEach((n) => U.setError(form, n, '')); alertBox.innerHTML = ''; form.elements.email.focus();
    }));
    form.addEventListener('submit', (e) => {
      e.preventDefault(); alertBox.innerHTML = '';
      const r = CM.auth.login(form.elements.email.value, form.elements.password.value, form.elements.remember.checked);
      if (!r.ok) {
        ['email', 'password'].forEach((n) => U.setError(form, n, (r.errors && r.errors[n]) || ''));
        if (r.message) showAlert('error', r.message);
        else { const bad = form.querySelector('[aria-invalid=true]'); if (bad) bad.focus(); }
        return;
      }
      const btn = U.qs('button[type=submit]', form); btn.disabled = true; btn.innerHTML = '<span class="spinner"></span> Đang đăng nhập…';
      const next = U.param('next');
      setTimeout(() => {
        const home = CM.auth.homeFor(r.user.role);
        // chỉ chuyển tới trang "next" nếu thuộc đúng khu vực của role
        if (next && /^[\w\-]+\.html/.test(next) && next.indexOf(r.user.role) === 0) location.href = CM.root + 'pages/' + r.user.role + '/' + next;
        else location.href = home;
      }, 500);
    });
  }

  /* ---------- Đăng ký ---------- */
  if (page === 'register') {
    const form = U.qs('#register-form');
    U.clearErrorsOnInput(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(form, {
        name: { label: 'Họ và tên', required: true, min: 2, max: 60 },
        email: { label: 'Email', required: true, pattern: CM.auth.EMAIL_RE, patternMsg: 'Email chưa đúng định dạng, ví dụ ten@gmail.com.' },
        phone: { label: 'Số điện thoại', pattern: /^(0|\+84)\d{8,10}$/, patternMsg: 'Số điện thoại chưa hợp lệ, ví dụ 0912345678.' },
        password: { label: 'Mật khẩu', required: true, custom: (v) => CM.auth.passwordProblem(v) },
        confirm: { label: 'Xác nhận mật khẩu', required: true, custom: (v, f) => (v !== f.elements.password.value ? 'Mật khẩu xác nhận chưa khớp.' : '') },
        agree: { custom: (v, f) => (!f.elements.agree.checked ? 'Bạn cần đồng ý điều khoản sử dụng bản demo.' : '') },
      });
      if (!ok) return;
      const r = CM.auth.register(U.formData(form));
      if (!r.ok) { Object.keys(r.errors || {}).forEach((n) => U.setError(form, n, r.errors[n])); if (r.message) U.toast(r.message, 'error'); return; }
      U.qs('#register-box').innerHTML = '<div class="alert ok">' + U.icon('check') + '<div><strong>Đăng ký thành công.</strong><p>Tài khoản Nông dân của bạn đã sẵn sàng.</p></div></div><a class="btn btn-block" style="margin-top:16px" href="login.html">Đăng nhập ngay</a>';
    });
  }

  /* ---------- Quên mật khẩu (mô phỏng) ---------- */
  if (page === 'forgot') {
    const form = U.qs('#forgot-form');
    U.clearErrorsOnInput(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(form, { email: { label: 'Email', required: true, pattern: CM.auth.EMAIL_RE, patternMsg: 'Email chưa đúng định dạng.' } })) return;
      const email = form.elements.email.value.trim().toLowerCase();
      const user = S.all('users').find((u) => u.email.toLowerCase() === email);
      // luôn hiển thị cùng một thông báo để không lộ email nào tồn tại
      U.qs('#forgot-box').innerHTML = '<div class="alert ok">' + U.icon('check') + '<div><strong>Đã ghi nhận yêu cầu.</strong><p>Đây là mô phỏng, không có email thật được gửi. ' + (user && user.status === 'active' ? 'Trong bản demo, hãy nhờ quản trị viên đặt lại mật khẩu tại mục Quản lý tài khoản.' : 'Nếu email tồn tại và đang hoạt động, quản trị viên có thể hỗ trợ đặt lại mật khẩu.') + '</p></div></div><a class="btn btn-outline btn-block" style="margin-top:16px" href="login.html">Về đăng nhập</a>';
    });
  }
})();
