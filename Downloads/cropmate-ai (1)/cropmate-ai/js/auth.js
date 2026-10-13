/* CropMate AI — xác thực MÔ PHỎNG phía Frontend.
   Không có bảo mật như Backend thật: mật khẩu demo lưu trong LocalStorage. */
(function () {
  const CM = (window.CM = window.CM || {});
  const KEY = 'cropmate.session';

  CM.root = (document.body && document.body.dataset.root) || '';

  CM.ROLE_HOME = {
    farmer: 'pages/farmer/farmer-season-dashboard.html',
    expert: 'pages/expert/expert-request-queue.html',
    coordinator: 'pages/coordinator/coordinator-farm-overview.html',
    admin: 'pages/admin/admin-dashboard.html',
  };

  function readSession() {
    let raw = null;
    try { raw = sessionStorage.getItem(KEY) || localStorage.getItem(KEY); } catch (e) { /* ignore */ }
    if (!raw) return null;
    try { return JSON.parse(raw); } catch (e) { return null; }
  }
  function clearSession() {
    try { sessionStorage.removeItem(KEY); localStorage.removeItem(KEY); } catch (e) { /* ignore */ }
  }

  const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

  CM.auth = {
    EMAIL_RE: EMAIL_RE,

    /** Kiểm tra độ mạnh mật khẩu: >= 8 ký tự, có chữ và số. */
    passwordProblem(pw) {
      if (!pw || pw.length < 8) return 'Mật khẩu cần ít nhất 8 ký tự.';
      if (!/[A-Za-z]/.test(pw) || !/\d/.test(pw)) return 'Mật khẩu cần có cả chữ và số.';
      return '';
    },

    login(email, password, remember) {
      const errors = {};
      email = (email || '').trim().toLowerCase();
      if (!email) errors.email = 'Vui lòng nhập email.';
      else if (!EMAIL_RE.test(email)) errors.email = 'Email chưa đúng định dạng, ví dụ ten@cropmate.vn.';
      if (!password) errors.password = 'Vui lòng nhập mật khẩu.';
      if (Object.keys(errors).length) return { ok: false, errors: errors };

      const user = CM.store.all('users').find((u) => (u.email || '').toLowerCase() === email);
      if (!user || user.password !== password) {
        return { ok: false, message: 'Email hoặc mật khẩu không đúng. Hãy kiểm tra lại hoặc dùng tài khoản demo.' };
      }
      if (user.status !== 'active') {
        return { ok: false, message: 'Tài khoản này đã bị vô hiệu hóa. Liên hệ quản trị viên để được kích hoạt lại.' };
      }
      const payload = JSON.stringify({ userId: user.id, role: user.role, at: Date.now() });
      clearSession();
      try { (remember ? localStorage : sessionStorage).setItem(KEY, payload); } catch (e) { /* ignore */ }
      return { ok: true, user: user };
    },

    /** Trả về user hiện tại nếu phiên hợp lệ và tài khoản còn hoạt động. */
    current() {
      const s = readSession();
      if (!s) return null;
      const u = CM.store.find('users', s.userId);
      if (!u || u.status !== 'active' || u.role !== s.role) { clearSession(); return null; }
      return u;
    },

    homeFor(role) { return CM.root + (CM.ROLE_HOME[role] || 'login.html'); },

    logout() { clearSession(); window.location.href = CM.root + 'login.html?out=1'; },

    /** Chặn truy cập: chưa đăng nhập → login; sai role → 403. role = null: mọi role đều được. */
    guard(role) {
      const u = CM.auth.current();
      if (!u) {
        const next = encodeURIComponent(location.pathname.split('/').pop() + location.search);
        window.location.replace(CM.root + 'login.html?expired=1&next=' + next);
        return null;
      }
      if (role && u.role !== role) {
        window.location.replace(CM.root + 'pages/shared/403.html');
        return null;
      }
      return u;
    },

    register(data) {
      const users = CM.store.all('users');
      if (users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
        return { ok: false, errors: { email: 'Email này đã được đăng ký.' } };
      }
      const user = CM.store.create('users', {
        name: data.name.trim(), email: data.email.trim().toLowerCase(), password: data.password,
        phone: (data.phone || '').trim(), role: 'farmer', status: 'active', createdAt: CM.today(),
      });
      if (!user) return { ok: false, message: 'Không lưu được dữ liệu. Bộ nhớ trình duyệt có thể đã đầy.' };
      CM.store.create('farms', { ownerId: user.id, name: data.farmName ? data.farmName.trim() : 'Nông hộ ' + user.name, address: (data.address || '').trim(), status: 'active' });
      CM.store.notify({ role: 'admin' }, 'Tài khoản mới', user.name + ' vừa đăng ký tài khoản Nông dân.', 'pages/admin/admin-user-management.html');
      return { ok: true, user: user };
    },
  };
})();
