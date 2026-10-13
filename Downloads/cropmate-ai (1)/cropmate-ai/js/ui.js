/* CropMate AI — thành phần giao diện dùng chung cho cả bốn role. */
(function () {
  const CM = (window.CM = window.CM || {});

  /* ---------- Icons (SVG nội tuyến) ---------- */
  const ICONS = {
    home: '<path d="M3 11l9-8 9 8M5 10v10h14V10"/>',
    book: '<path d="M4 4h12a4 4 0 0 1 4 4v12H8a4 4 0 0 1-4-4zM4 16a4 4 0 0 1 4-4h12"/>',
    lifebuoy: '<circle cx="12" cy="12" r="9"/><circle cx="12" cy="12" r="4"/><path d="M5.6 5.6l3.5 3.5M14.9 14.9l3.5 3.5M18.4 5.6l-3.5 3.5M9.1 14.9l-3.5 3.5"/>',
    bell: '<path d="M6 16v-5a6 6 0 0 1 12 0v5l2 2H4zM10 21h4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21a8 8 0 0 1 16 0"/>',
    logout: '<path d="M9 4H5v16h4M16 8l4 4-4 4M20 12H9"/>',
    menu: '<path d="M4 6h16M4 12h16M4 18h16"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-4-4"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16zM13 7l4 4"/>',
    trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>',
    check: '<path d="M5 12l5 5 9-10"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    calendar: '<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M3 10h18M8 3v4M16 3v4"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20a7 7 0 0 1 14 0M16 5a3.5 3.5 0 0 1 0 7M18 14a7 7 0 0 1 4 6"/>',
    leaf: '<path d="M5 19C5 10 11 4 20 4c0 9-6 15-15 15zM5 19l8-8"/>',
    sparkles: '<path d="M12 3l1.8 5.2L19 10l-5.2 1.8L12 17l-1.8-5.2L5 10l5.2-1.8zM19 16l.8 2.2L22 19l-2.2.8L19 22l-.8-2.2L16 19l2.2-.8z"/>',
    inbox: '<path d="M3 13l3-8h12l3 8v6H3zM3 13h5l1 3h6l1-3h5"/>',
    library: '<path d="M4 4v16M9 4v16M14 6l5 14M3 20h18"/>',
    clipboard: '<rect x="6" y="4" width="12" height="17" rx="2"/><path d="M9 4h6v3H9zM9 12h6M9 16h4"/>',
    chart: '<path d="M4 20V4M4 20h16M8 16v-5M12 16V8M16 16v-3"/>',
    shield: '<path d="M12 3l8 3v6c0 5-3.5 8-8 9-4.5-1-8-4-8-9V6z"/>',
    alert: '<path d="M12 4l9 16H3zM12 10v4M12 17v.5"/>',
    file: '<path d="M6 3h8l4 4v14H6zM14 3v4h4"/>',
    map: '<path d="M12 21s-6-6-6-11a6 6 0 0 1 12 0c0 5-6 11-6 11z"/><circle cx="12" cy="10" r="2"/>',
    archive: '<rect x="3" y="4" width="18" height="4"/><path d="M5 8v12h14V8M10 12h4"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    refresh: '<path d="M20 11a8 8 0 0 0-14-4L4 9M4 4v5h5M4 13a8 8 0 0 0 14 4l2-2M20 20v-5h-5"/>',
    list: '<path d="M8 6h13M8 12h13M8 18h13M3 6h.5M3 12h.5M3 18h.5"/>',
    send: '<path d="M21 3L10 14M21 3l-7 18-4-7-7-4z"/>',
    sprout: '<path d="M12 21v-9M12 12C12 8 9 6 5 6c0 4 3 6 7 6zM12 14c0-3 2-5 6-5 0 3-2 5-6 5z"/>',
  };
  function icon(name, cls) {
    return '<svg class="icon ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true" focusable="false">' + (ICONS[name] || '') + '</svg>';
  }

  /* ---------- Helpers ---------- */
  function esc(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
  }
  function fmtDate(iso) {
    if (!iso) return '—';
    const p = String(iso).slice(0, 10).split('-');
    return p.length === 3 ? p[2] + '/' + p[1] + '/' + p[0] : iso;
  }
  function fmtDateTime(iso) {
    if (!iso) return '—';
    const d = new Date(iso);
    if (isNaN(d)) return iso;
    const p = (x) => String(x).padStart(2, '0');
    return p(d.getHours()) + ':' + p(d.getMinutes()) + ' ' + p(d.getDate()) + '/' + p(d.getMonth() + 1) + '/' + d.getFullYear();
  }
  function daysFromToday(iso) {
    const a = new Date(CM.today() + 'T12:00:00'), b = new Date(iso + 'T12:00:00');
    return Math.round((b - a) / 86400000);
  }
  function debounce(fn, ms) { let t; return function () { const a = arguments, c = this; clearTimeout(t); t = setTimeout(() => fn.apply(c, a), ms || 200); }; }
  function qs(sel, root) { return (root || document).querySelector(sel); }
  function qsa(sel, root) { return Array.from((root || document).querySelectorAll(sel)); }
  function param(name) { return new URLSearchParams(location.search).get(name); }
  function norm(s) { return String(s || '').toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd'); }
  function nl2br(s) { return esc(s).replace(/\n/g, '<br>'); }

  /* ---------- Badges ---------- */
  function badge(kind, text) { return '<span class="badge ' + (kind || '') + '">' + esc(text) + '</span>'; }
  const REQ_STATUS = { pending: ['warn', 'Chờ tiếp nhận'], processing: ['info', 'Đang xử lý'], resolved: ['ok', 'Đã giải quyết'], rejected: ['danger', 'Bị từ chối'], cancelled: ['', 'Đã hủy'] };
  const SEASON_STATUS = { active: ['ok', 'Đang canh tác'], completed: ['info', 'Đã hoàn thành'], archived: ['', 'Đã lưu trữ'] };
  const TASK_STATUS = { todo: ['', 'Chưa làm'], doing: ['info', 'Đang làm'], done: ['ok', 'Hoàn thành'] };
  const PRIORITY = { low: ['', 'Thấp'], medium: ['info', 'Trung bình'], high: ['warn', 'Cao'], urgent: ['danger', 'Khẩn cấp'] };
  const ACCOUNT_STATUS = { active: ['ok', 'Hoạt động'], inactive: ['danger', 'Vô hiệu hóa'] };
  const FARM_HEALTH = { ok: ['ok', 'Đúng tiến độ'], late: ['warn', 'Trễ hạn'], priority: ['danger', 'Cần ưu tiên'], paused: ['', 'Tạm ngưng'] };
  const ROLE_LABEL = { farmer: 'Nông dân', expert: 'Chuyên gia', coordinator: 'Điều phối HTX', admin: 'Quản trị viên' };
  const CAT_LABEL = { pest: 'Sâu bệnh', water: 'Thiếu nước', nutrient: 'Thiếu dinh dưỡng', other: 'Vấn đề khác' };
  function mapBadge(map, key) { const m = map[key] || ['', key || '—']; return badge(m[0], m[1]); }

  /* ---------- Empty / loading ---------- */
  function empty(ic, title, text, actionHtml) {
    return '<div class="empty"><div class="ico">' + icon(ic) + '</div><h3>' + esc(title) + '</h3><p>' + esc(text || '') + '</p>' + (actionHtml || '') + '</div>';
  }
  function loading(rows) {
    let h = '<div class="loading" role="status" aria-label="Đang tải dữ liệu">';
    for (let i = 0; i < (rows || 4); i++) h += '<div class="skel" style="width:' + (92 - i * 11) + '%"></div>';
    return h + '</div>';
  }
  /** Hiển thị trạng thái đang tải ngắn rồi mới vẽ nội dung (mô phỏng tải dữ liệu). */
  function withLoading(el, fn, ms) {
    el.innerHTML = loading(4);
    setTimeout(fn, ms == null ? 280 : ms);
  }

  /* ---------- Toast ---------- */
  function toast(msg, type) {
    let box = qs('.toasts');
    if (!box) { box = document.createElement('div'); box.className = 'toasts'; box.setAttribute('role', 'status'); box.setAttribute('aria-live', 'polite'); document.body.appendChild(box); }
    const t = document.createElement('div');
    t.className = 'toast ' + (type || '');
    t.textContent = msg;
    box.appendChild(t);
    setTimeout(() => { t.remove(); }, type === 'error' ? 6000 : 3800);
  }

  /* ---------- Modal ---------- */
  function openModal(opts) {
    const dlg = document.createElement('dialog');
    dlg.className = 'modal ' + (opts.size || '');
    const tid = 'mt-' + Math.random().toString(36).slice(2, 7);
    dlg.setAttribute('aria-labelledby', tid);
    dlg.innerHTML =
      '<div class="modal-head"><h2 id="' + tid + '">' + esc(opts.title) + '</h2>' +
      '<button type="button" class="icon-btn" data-close aria-label="Đóng">' + icon('x') + '</button></div>' +
      '<div class="modal-body">' + (opts.body || '') + '</div>' +
      (opts.footer ? '<div class="modal-foot">' + opts.footer + '</div>' : '');
    document.body.appendChild(dlg);
    const api = {
      el: dlg, body: qs('.modal-body', dlg), foot: qs('.modal-foot', dlg),
      close() { if (dlg.open) dlg.close(); },
    };
    dlg.addEventListener('click', (e) => {
      if (e.target.closest('[data-close]')) api.close();
      else if (e.target === dlg) api.close();
    });
    dlg.addEventListener('close', () => { dlg.remove(); if (opts.onClose) opts.onClose(); });
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
    const first = qs('input:not([type=hidden]),select,textarea', dlg);
    if (first && opts.autofocus !== false) first.focus();
    return api;
  }

  function confirmDialog(o) {
    return new Promise((resolve) => {
      let result = false;
      const m = openModal({
        title: o.title || 'Xác nhận', size: 'sm',
        body: '<p>' + (o.html || esc(o.message || 'Bạn có chắc chắn muốn thực hiện thao tác này?')) + '</p>',
        footer: '<button type="button" class="btn btn-outline" data-close>' + esc(o.cancelText || 'Hủy') + '</button>' +
          '<button type="button" class="btn ' + (o.danger ? 'btn-danger' : '') + '" data-ok>' + esc(o.confirmText || 'Xác nhận') + '</button>',
        autofocus: false,
        onClose() { resolve(result); },
      });
      qs('[data-ok]', m.el).addEventListener('click', () => { result = true; m.close(); });
      qs('[data-ok]', m.el).focus();
    });
  }

  /* lightbox ảnh */
  document.addEventListener('click', (e) => {
    const img = e.target.closest && e.target.closest('img[data-zoom]');
    if (!img) return;
    openModal({ title: 'Xem ảnh', size: 'lg', body: '<img src="' + img.src + '" alt="' + esc(img.alt || 'Ảnh minh họa') + '" style="max-height:70vh;margin:auto;border-radius:8px">', autofocus: false });
  });

  /* ---------- Form builder + validation ---------- */
  function optionList(options, value) {
    return options.map((o) => {
      const v = typeof o === 'object' ? o.value : o, l = typeof o === 'object' ? o.label : o;
      return '<option value="' + esc(v) + '"' + (String(v) === String(value == null ? '' : value) ? ' selected' : '') + '>' + esc(l) + '</option>';
    }).join('');
  }
  function field(o) {
    const id = 'f-' + o.name, err = 'err-' + o.name;
    const type = o.type || 'text';
    const common = ' id="' + id + '" name="' + o.name + '" aria-describedby="' + err + (o.help ? ' help-' + o.name : '') + '"' + (o.required ? ' required aria-required="true"' : '') + (o.placeholder ? ' placeholder="' + esc(o.placeholder) + '"' : '') + (o.disabled ? ' disabled' : '') + (o.attrs ? ' ' + o.attrs : '');
    let control;
    if (type === 'select') control = '<select' + common + '>' + (o.blank ? '<option value="">' + esc(o.blank) + '</option>' : '') + optionList(o.options || [], o.value) + '</select>';
    else if (type === 'textarea') control = '<textarea' + common + ' rows="' + (o.rows || 4) + '">' + esc(o.value || '') + '</textarea>';
    else if (type === 'password') control = '<div class="pw-wrap"><input type="password" autocomplete="' + (o.autocomplete || 'current-password') + '"' + common + '><button type="button" data-toggle-pw aria-label="Hiện hoặc ẩn mật khẩu">Hiện</button></div>';
    else control = '<input type="' + type + '" value="' + esc(o.value == null ? '' : o.value) + '"' + common + (o.autocomplete ? ' autocomplete="' + o.autocomplete + '"' : '') + '>';
    return '<div class="field' + (o.full ? ' full' : '') + '"><label for="' + id + '">' + esc(o.label) + (o.required ? ' <span class="req" aria-hidden="true">*</span>' : '') + '</label>' + control +
      (o.help ? '<p class="help" id="help-' + o.name + '">' + esc(o.help) + '</p>' : '') + '<p class="field-error" id="' + err + '" hidden></p></div>';
  }
  document.addEventListener('click', (e) => {
    const b = e.target.closest && e.target.closest('[data-toggle-pw]');
    if (!b) return;
    const inp = b.parentElement.querySelector('input');
    inp.type = inp.type === 'password' ? 'text' : 'password';
    b.textContent = inp.type === 'password' ? 'Hiện' : 'Ẩn';
  });

  function setError(form, name, msg) {
    const input = form.elements[name], p = form.querySelector('#err-' + name);
    if (!p) return;
    if (msg) { p.textContent = msg; p.hidden = false; if (input) input.setAttribute('aria-invalid', 'true'); }
    else { p.textContent = ''; p.hidden = true; if (input && input.removeAttribute) input.removeAttribute('aria-invalid'); }
  }
  /** rules: { name: {label, required, min, max, pattern, patternMsg, custom(value, form) → message} } */
  function validate(form, rules) {
    let ok = true, firstBad = null;
    Object.keys(rules).forEach((name) => {
      const r = rules[name], el = form.elements[name];
      const v = el ? String(el.value || '').trim() : '';
      let msg = '';
      if (r.required && !v) msg = 'Vui lòng nhập ' + (r.label || name).toLowerCase() + '.';
      else if (v && r.min && v.length < r.min) msg = (r.label || name) + ' cần ít nhất ' + r.min + ' ký tự.';
      else if (v && r.max && v.length > r.max) msg = (r.label || name) + ' tối đa ' + r.max + ' ký tự.';
      else if (v && r.pattern && !r.pattern.test(v)) msg = r.patternMsg || (r.label || name) + ' chưa đúng định dạng.';
      else if (r.custom) msg = r.custom(v, form) || '';
      setError(form, name, msg);
      if (msg) { ok = false; if (!firstBad) firstBad = el; }
    });
    if (firstBad && firstBad.focus) firstBad.focus();
    return ok;
  }
  function clearErrorsOnInput(root) {
    root.addEventListener('input', (e) => { if (e.target.name) setError(e.target.form || root, e.target.name, ''); });
    root.addEventListener('change', (e) => { if (e.target.name && e.target.form) setError(e.target.form, e.target.name, ''); });
  }
  function formData(form) {
    const o = {};
    Array.from(form.elements).forEach((el) => { if (el.name && el.type !== 'file' && el.type !== 'submit' && el.type !== 'button') o[el.name] = el.type === 'checkbox' ? el.checked : String(el.value).trim(); });
    return o;
  }

  /* ---------- Ảnh (đọc, nén nhỏ, lưu dạng dataURL) ---------- */
  function readImages(files, max) {
    const list = Array.from(files || []).slice(0, max || 3);
    return Promise.all(list.map((f) => new Promise((resolve, reject) => {
      if (!/^image\/(png|jpe?g|webp|gif)$/.test(f.type)) return reject(new Error('"' + f.name + '" không phải ảnh hợp lệ (png, jpg, webp).'));
      if (f.size > 6 * 1024 * 1024) return reject(new Error('"' + f.name + '" lớn hơn 6 MB.'));
      const fr = new FileReader();
      fr.onerror = () => reject(new Error('Không đọc được ảnh "' + f.name + '".'));
      fr.onload = () => {
        const img = new Image();
        img.onerror = () => reject(new Error('Ảnh "' + f.name + '" bị lỗi.'));
        img.onload = () => {
          const max = 720, k = Math.min(1, max / Math.max(img.width, img.height));
          const c = document.createElement('canvas');
          c.width = Math.round(img.width * k); c.height = Math.round(img.height * k);
          c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.7));
        };
        img.src = fr.result;
      };
      fr.readAsDataURL(f);
    })));
  }
  /** Khối chọn ảnh có xem trước. Trả về {get(), set(list)} */
  function imagePicker(root, initial, max) {
    let imgs = (initial || []).slice();
    max = max || 3;
    root.innerHTML = '<div class="thumbs" data-thumbs></div><input type="file" accept="image/png,image/jpeg,image/webp" multiple data-file aria-label="Chọn ảnh minh họa">' +
      '<p class="help small muted">Tối đa ' + max + ' ảnh, mỗi ảnh dưới 6 MB. Ảnh được nén nhỏ và lưu trong trình duyệt.</p><p class="field-error" data-img-err hidden></p>';
    const thumbs = qs('[data-thumbs]', root), errEl = qs('[data-img-err]', root);
    function draw() {
      thumbs.innerHTML = imgs.map((s, i) => '<div class="thumb"><img src="' + s + '" alt="Ảnh minh họa ' + (i + 1) + '" data-zoom><button type="button" class="rm" data-rm="' + i + '" aria-label="Xóa ảnh ' + (i + 1) + '">×</button></div>').join('');
    }
    draw();
    root.addEventListener('click', (e) => { const b = e.target.closest('[data-rm]'); if (b) { imgs.splice(+b.dataset.rm, 1); draw(); } });
    qs('[data-file]', root).addEventListener('change', (e) => {
      errEl.hidden = true;
      const room = max - imgs.length;
      if (room <= 0) { errEl.textContent = 'Đã đủ ' + max + ' ảnh. Hãy xóa bớt trước khi thêm.'; errEl.hidden = false; e.target.value = ''; return; }
      readImages(e.target.files, room).then((r) => { imgs = imgs.concat(r); draw(); }).catch((er) => { errEl.textContent = er.message; errEl.hidden = false; });
      e.target.value = '';
    });
    return { get: () => imgs.slice(), set: (l) => { imgs = l.slice(); draw(); } };
  }

  /* ---------- Biểu đồ thanh ngang ---------- */
  function bars(rows, opts) {
    opts = opts || {};
    const max = Math.max(1, opts.max || Math.max.apply(null, rows.map((r) => r.value)));
    return rows.map((r) => '<div class="bar-row"><span>' + esc(r.label) + '</span><div class="progress ' + (r.tone || '') + '" role="img" aria-label="' + esc(r.label) + ': ' + r.value + '"><span style="width:' + Math.round((r.value / max) * 100) + '%"></span></div><strong>' + r.value + '</strong></div>').join('');
  }

  /* ---------- Shell: sidebar + topbar theo role ---------- */
  const P = 'pages/';
  const NAV = {
    farmer: [
      { id: 'farmer-season-dashboard', href: P + 'farmer/farmer-season-dashboard.html', label: 'Tổng quan mùa vụ', icon: 'home' },
      { id: 'farmer-seasons', href: P + 'farmer/farmer-seasons.html', label: 'Mùa vụ & thửa ruộng', icon: 'leaf' },
      { id: 'farmer-field-log', href: P + 'farmer/farmer-field-log.html', label: 'Nhật ký canh tác', icon: 'book' },
      { id: 'farmer-checklist', href: P + 'farmer/farmer-checklist.html', label: 'Checklist mùa vụ', icon: 'clipboard' },
      { id: 'farmer-help-request', href: P + 'farmer/farmer-help-request.html', label: 'Yêu cầu hỗ trợ', icon: 'lifebuoy' },
    ],
    expert: [
      { id: 'expert-request-queue', href: P + 'expert/expert-request-queue.html', label: 'Hàng chờ yêu cầu', icon: 'inbox' },
      { id: 'expert-resource-library', href: P + 'expert/expert-resource-library.html', label: 'Thư viện tài nguyên', icon: 'library' },
    ],
    coordinator: [
      { id: 'coordinator-farm-overview', href: P + 'coordinator/coordinator-farm-overview.html', label: 'Tổng quan nông hộ', icon: 'map' },
      { id: 'coordinator-calendar', href: P + 'coordinator/coordinator-calendar.html', label: 'Lịch hoạt động', icon: 'calendar' },
      { id: 'coordinator-season-summary', href: P + 'coordinator/coordinator-season-summary.html', label: 'Tổng kết mùa vụ', icon: 'chart' },
    ],
    admin: [
      { id: 'admin-dashboard', href: P + 'admin/admin-dashboard.html', label: 'Tổng quan hệ thống', icon: 'home' },
      { id: 'admin-user-management', href: P + 'admin/admin-user-management.html', label: 'Quản lý tài khoản', icon: 'users' },
      { id: 'admin-crop-management', href: P + 'admin/admin-crop-management.html', label: 'Danh mục cây trồng', icon: 'sprout' },
    ],
  };

  function mountShell(user) {
    const root = CM.root, page = document.body.dataset.nav || document.body.dataset.page;
    const sb = qs('#sidebar'), tb = qs('#topbar');
    const unread = CM.store.unreadCount(user);
    const link = (n, extra) => '<li><a href="' + root + n.href + '"' + (n.id === page ? ' aria-current="page"' : '') + '>' + icon(n.icon) + '<span>' + esc(n.label) + '</span>' + (extra || '') + '</a></li>';
    const initials = user.name.replace(/^(TS\.|ThS\.|PGS\.)\s*/i, '').trim().split(/\s+/).slice(-1)[0].charAt(0).toUpperCase();

    sb.innerHTML =
      '<a class="brand" href="' + CM.auth.homeFor(user.role) + '"><span class="brand-mark">' + icon('sprout') + '</span><span>CropMate AI<small>Nhật ký mùa vụ & trợ lý canh tác</small></span></a>' +
      '<div class="nav-label">' + esc(ROLE_LABEL[user.role]) + '</div>' +
      '<ul class="nav">' + NAV[user.role].map((n) => link(n)).join('') + '</ul>' +
      '<div class="nav-label">Tài khoản</div>' +
      '<ul class="nav">' +
      link({ id: 'profile', href: P + 'shared/profile.html', label: 'Hồ sơ cá nhân', icon: 'user' }) +
      link({ id: 'notifications', href: P + 'shared/notifications.html', label: 'Thông báo', icon: 'bell' }, unread ? '<span class="count">' + unread + '</span>' : '') +
      '</ul>' +
      '<div class="sidebar-foot"><button type="button" class="btn btn-outline btn-sm btn-block" data-logout>' + icon('logout') + ' Đăng xuất</button><p style="margin-top:10px">Bản demo mô phỏng Frontend. Dữ liệu lưu trong trình duyệt của bạn.</p></div>';

    tb.innerHTML =
      '<button type="button" class="icon-btn menu-btn" data-menu aria-label="Mở menu" aria-controls="sidebar" aria-expanded="false">' + icon('menu') + '</button>' +
      '<h1>' + esc(document.body.dataset.title || document.title) + '</h1>' +
      '<a class="icon-btn" href="' + root + P + 'shared/notifications.html" aria-label="Thông báo' + (unread ? ', ' + unread + ' chưa đọc' : '') + '">' + icon('bell') + (unread ? '<span class="dot">' + unread + '</span>' : '') + '</a>' +
      '<a class="user-chip" href="' + root + P + 'shared/profile.html"><span class="avatar" aria-hidden="true">' + esc(initials) + '</span><span class="meta">' + esc(user.name) + '<span>' + esc(ROLE_LABEL[user.role]) + '</span></span></a>';

    let scrim = qs('#scrim');
    if (!scrim) { scrim = document.createElement('div'); scrim.id = 'scrim'; scrim.className = 'scrim'; document.body.appendChild(scrim); }
    const menuBtn = qs('[data-menu]', tb);
    function setMenu(open) { sb.classList.toggle('is-open', open); scrim.classList.toggle('is-open', open); menuBtn.setAttribute('aria-expanded', open ? 'true' : 'false'); }
    menuBtn.addEventListener('click', () => setMenu(!sb.classList.contains('is-open')));
    scrim.addEventListener('click', () => setMenu(false));
    document.addEventListener('keydown', (e) => { if (e.key === 'Escape') setMenu(false); });
    qs('[data-logout]', sb).addEventListener('click', () => {
      confirmDialog({ title: 'Đăng xuất', message: 'Bạn muốn đăng xuất khỏi CropMate AI?', confirmText: 'Đăng xuất' }).then((ok) => { if (ok) CM.auth.logout(); });
    });
  }

  /* ---------- AI panel dùng chung cho 3 tính năng AI (mô phỏng) ----------
     Luồng: nhập dữ liệu → validation → đang xử lý → kết quả → giải thích →
            chấp nhận / chỉnh sửa / từ chối / tạo lại → lưu vào dữ liệu ứng dụng. */
  function aiPanel(el, cfg) {
    const st = { phase: 'idle', attempt: 0, input: null, res: null, data: null };
    el.innerHTML =
      '<section class="ai-panel" aria-label="' + esc(cfg.title) + '"><div class="ai-head"><div class="row"><span class="tag-ai">' + icon('sparkles') + ' AI mô phỏng</span><strong>' + esc(cfg.title) + '</strong></div>' +
      '<label class="check small"><input type="checkbox" data-sim-error> Mô phỏng lỗi hệ thống</label></div>' +
      '<div class="ai-body" data-ai-body aria-live="polite"></div></section>';
    const body = qs('[data-ai-body]', el);
    const note = '<p class="ai-note">Đây là mô phỏng bằng JavaScript (quy tắc từ khóa/dữ liệu nhập), không gọi mô hình AI thật. Kết quả chỉ mang tính tham khảo.</p>';

    function btn(act, label, cls, ic) { return '<button type="button" class="btn btn-sm ' + (cls || 'btn-outline') + '" data-ai="' + act + '">' + (ic ? icon(ic) : '') + esc(label) + '</button>'; }

    function render() {
      let h = '';
      const p = st.phase;
      if (p === 'idle') {
        h = '<p>' + esc(cfg.intro || '') + '</p><div class="ai-actions" style="border:0;margin-top:10px;padding-top:0">' + btn('run', cfg.runLabel || 'Chạy AI mô phỏng', 'btn-wheat', 'sparkles') + '</div>' + note;
      } else if (p === 'processing') {
        h = '<div class="ai-state" role="status"><span class="spinner"></span><div><strong>Đang xử lý…</strong><p class="small muted">AI mô phỏng đang phân tích dữ liệu bạn nhập.</p></div></div>';
      } else if (p === 'insufficient') {
        h = '<div class="alert warn">' + icon('alert') + '<div><strong>Không đủ dữ liệu để đưa ra đề xuất</strong><p>' + esc(st.res.message || '') + '</p>' +
          (st.res.missing && st.res.missing.length ? '<ul style="margin:6px 0 0;padding-left:18px">' + st.res.missing.map((m) => '<li>' + esc(m) + '</li>').join('') + '</ul>' : '') + '</div></div>' +
          '<div class="ai-actions">' + btn('supplement', 'Bổ sung dữ liệu', 'btn-wheat', 'edit') + (cfg.onManual ? btn('manual', cfg.manualLabel || 'Thực hiện thủ công') : '') + '</div>';
      } else if (p === 'uncertain') {
        h = '<div class="alert warn">' + icon('alert') + '<div><strong>AI chưa chắc chắn về kết quả</strong><p>' + esc(st.res.message || '') + '</p></div></div>' +
          (st.res.data ? '<details style="margin-top:10px"><summary class="small">Xem đề xuất độ tin cậy thấp</summary><div class="ai-result">' + cfg.renderResult(st.res.data) + '</div></details>' : '') +
          '<div class="ai-actions">' + btn('supplement', 'Bổ sung dữ liệu', 'btn-wheat', 'edit') + btn('retry', 'Thử lại', 'btn-outline', 'refresh') + (cfg.onManual ? btn('manual', cfg.manualLabel || 'Thực hiện thủ công') : '') + '</div>';
      } else if (p === 'error') {
        h = '<div class="alert error">' + icon('alert') + '<div><strong>Không thể xử lý yêu cầu lúc này</strong><p>' + esc(st.res.message || 'Dịch vụ AI mô phỏng tạm thời gặp sự cố. Dữ liệu bạn nhập vẫn được giữ nguyên.') + '</p></div></div>' +
          '<div class="ai-actions">' + btn('retry', 'Thử lại', 'btn-wheat', 'refresh') + (cfg.onManual ? btn('manual', cfg.manualLabel || 'Thực hiện thủ công') : '') + '</div>';
      } else if (p === 'result' || p === 'accepted') {
        h = '<div class="ai-result">' + cfg.renderResult(st.data) + '</div>' +
          (p === 'accepted' ? '<div class="alert ok" style="margin-top:12px">' + icon('check') + '<div>' + esc(st.acceptedMsg || 'Đã chấp nhận kết quả.') + '</div></div>' : '') +
          '<div class="ai-actions">' + (p === 'result' ? btn('accept', cfg.acceptLabel || 'Chấp nhận kết quả', '', 'check') : '') + btn('edit', 'Chỉnh sửa', 'btn-outline', 'edit') + (p === 'result' ? btn('reject', 'Từ chối', 'btn-outline', 'x') : '') + btn('regen', 'Tạo lại', 'btn-outline', 'refresh') + '</div>' + note;
      } else if (p === 'edit') {
        h = '<div data-editor>' + cfg.renderEditor(st.data) + '</div><div class="ai-actions">' + btn('save-edit', 'Lưu chỉnh sửa', '', 'check') + btn('cancel-edit', 'Hủy chỉnh sửa', 'btn-outline') + '</div>';
      } else if (p === 'rejected') {
        h = '<div class="alert info">' + icon('x') + '<div><strong>Đã từ chối kết quả AI</strong><p>Kết quả này không được lưu. Bạn có thể tạo lại hoặc thực hiện thủ công.</p></div></div>' +
          '<div class="ai-actions">' + btn('regen', 'Tạo lại', 'btn-wheat', 'refresh') + (cfg.onManual ? btn('manual', cfg.manualLabel || 'Thực hiện thủ công') : '') + '</div>';
      }
      body.innerHTML = h;
    }

    async function run() {
      const input = cfg.getInput();
      if (!input) return; // getInput tự hiển thị lỗi validation
      st.input = input; st.phase = 'processing'; render();
      const forceError = qs('[data-sim-error]', el).checked;
      let res;
      try { res = await cfg.run(input, st.attempt, { forceError: forceError }); }
      catch (e) { res = { status: 'error', message: '' }; }
      st.res = res;
      if (res.status === 'ok') { st.data = res.data; st.phase = 'result'; }
      else st.phase = res.status;
      render();
    }

    el.addEventListener('click', async (e) => {
      const b = e.target.closest('[data-ai]'); if (!b) return;
      const act = b.dataset.ai;
      if (act === 'run') { st.attempt = 0; run(); }
      else if (act === 'retry' || act === 'regen') { st.attempt += 1; run(); }
      else if (act === 'supplement') { st.phase = 'idle'; render(); if (cfg.onSupplement) cfg.onSupplement(st.res); }
      else if (act === 'manual') { st.phase = 'idle'; render(); cfg.onManual(); }
      else if (act === 'accept') { const msg = await cfg.onAccept(st.data, 'accepted', st.input); st.acceptedMsg = typeof msg === 'string' ? msg : ''; st.phase = 'accepted'; render(); }
      else if (act === 'reject') { st.phase = 'rejected'; render(); if (cfg.onReject) cfg.onReject(st.data); }
      else if (act === 'edit') { st.prevPhase = st.phase; st.phase = 'edit'; render(); }
      else if (act === 'cancel-edit') { st.phase = st.prevPhase === 'accepted' ? 'accepted' : 'result'; render(); }
      else if (act === 'save-edit') {
        const edited = cfg.readEditor(qs('[data-editor]', body), st.data);
        if (!edited) return;
        st.data = edited;
        const msg = await cfg.onAccept(st.data, 'edited', st.input);
        st.acceptedMsg = typeof msg === 'string' ? msg : 'Đã lưu bản chỉnh sửa.'; st.phase = 'accepted'; render();
      }
    });
    render();
    return { reset() { st.phase = 'idle'; st.attempt = 0; render(); }, state: st };
  }

  CM.ui = {
    icon, esc, fmtDate, fmtDateTime, daysFromToday, debounce, qs, qsa, param, norm, nl2br,
    badge, mapBadge, REQ_STATUS, SEASON_STATUS, TASK_STATUS, PRIORITY, ACCOUNT_STATUS, FARM_HEALTH, ROLE_LABEL, CAT_LABEL,
    empty, loading, withLoading, toast, openModal, confirm: confirmDialog,
    field, optionList, validate, setError, clearErrorsOnInput, formData, readImages, imagePicker, bars,
    mountShell, aiPanel,
  };
})();
