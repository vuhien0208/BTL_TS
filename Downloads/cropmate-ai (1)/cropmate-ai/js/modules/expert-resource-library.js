(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('expert');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const TYPES = ['Hướng dẫn', 'Tài liệu', 'Video', 'Biểu mẫu'];
  const state = { q: '', type: '', crop: '' };
  const URL_RE = /^https?:\/\/[^\s]+\.[^\s]+$/i;

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Thư viện tài nguyên</h2><p>Quản lý tài liệu, hướng dẫn và biểu mẫu nông nghiệp. Bạn có thể đính kèm tài nguyên khi phản hồi yêu cầu hỗ trợ.</p></div><button class="btn" data-new>' + U.icon('plus') + ' Thêm tài nguyên</button></div>' +
      '<div class="card"><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm tài nguyên</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tiêu đề, mô tả…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-type">Loại</label><select id="flt-type">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(TYPES), state.type) + '</select></div>' +
      '<div class="field"><label for="flt-crop">Cây trồng</label><select id="flt-crop">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: '_none', label: 'Dùng chung' }].concat(S.all('crops').map((c) => ({ value: c.id, label: c.name }))), state.crop) + '</select></div></div>' +
      '<div id="list" style="padding:16px 20px"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-type', view).addEventListener('change', (e) => { state.type = e.target.value; list(); });
    U.qs('#flt-crop', view).addEventListener('change', (e) => { state.crop = e.target.value; list(); });
    list();
  }

  function list() {
    const q = U.norm(state.q), box = U.qs('#list', view);
    const rows = S.all('resources').filter((r) => !state.type || r.type === state.type)
      .filter((r) => !state.crop || (state.crop === '_none' ? !r.cropId : r.cropId === state.crop))
      .filter((r) => !q || U.norm(r.title + ' ' + r.summary).includes(q))
      .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1));
    if (!rows.length) {
      const f = q || state.type || state.crop;
      box.innerHTML = U.empty('library', f ? 'Không tìm thấy tài nguyên' : 'Thư viện đang trống', f ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Thêm tài liệu đầu tiên để chia sẻ với nông dân.', f ? '' : '<button class="btn" data-new>Thêm tài nguyên</button>');
      return;
    }
    box.innerHTML = '<div class="card-grid">' + rows.map((r) =>
      '<article class="card card-pad stack" style="gap:8px;box-shadow:none"><div class="row spread">' + U.badge('info', r.type) + '<span class="small muted">' + U.fmtDate(r.updatedAt) + '</span></div><h3>' + U.esc(r.title) + '</h3><p class="small muted">' + (r.cropId ? U.esc(Q.cropName(r.cropId)) : 'Dùng chung cho mọi cây trồng') + ' · ' + U.esc(Q.userName(r.authorId)) + '</p><p class="small">' + U.esc(r.summary) + '</p>' +
      '<div class="row" style="margin-top:auto"><a class="btn btn-sm btn-outline" href="' + U.esc(r.url) + '" target="_blank" rel="noopener">Mở tài liệu</a><button class="btn btn-sm btn-ghost" data-edit="' + r.id + '">' + U.icon('edit') + ' Sửa</button><button class="btn btn-sm btn-ghost" data-del="' + r.id + '">' + U.icon('trash') + ' Xóa</button></div></article>').join('') + '</div>' +
      '<p class="small muted" style="margin-top:12px">Hiển thị ' + rows.length + ' tài nguyên.</p>';
  }

  function form(r) {
    const m = U.openModal({
      title: r ? 'Sửa tài nguyên' : 'Thêm tài nguyên',
      body: '<form id="rf" novalidate><div class="form-grid">' +
        U.field({ name: 'title', label: 'Tiêu đề', required: true, value: r ? r.title : '', full: true }) +
        U.field({ name: 'type', label: 'Loại', type: 'select', options: TYPES, value: r ? r.type : 'Hướng dẫn' }) +
        U.field({ name: 'cropId', label: 'Cây trồng', type: 'select', options: S.all('crops').map((c) => ({ value: c.id, label: c.name })), blank: 'Dùng chung', value: r ? r.cropId : '' }) +
        U.field({ name: 'url', label: 'Đường dẫn tài liệu', type: 'text', required: true, value: r ? r.url : '', placeholder: 'https://…', full: true }) +
        U.field({ name: 'summary', label: 'Tóm tắt nội dung', type: 'textarea', rows: 3, required: true, value: r ? r.summary : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="rf" type="submit">' + (r ? 'Lưu thay đổi' : 'Thêm tài nguyên') + '</button>',
    });
    const f = U.qs('#rf', m.el); U.clearErrorsOnInput(f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(f, { title: { label: 'Tiêu đề', required: true, min: 5, max: 120 }, url: { label: 'Đường dẫn', required: true, pattern: URL_RE, patternMsg: 'Đường dẫn cần bắt đầu bằng http:// hoặc https://.' }, summary: { label: 'Tóm tắt', required: true, min: 10, max: 300 } })) return;
      const d = U.formData(f), rec = { title: d.title, type: d.type, cropId: d.cropId, url: d.url, summary: d.summary, updatedAt: CM.today() };
      if (r) S.update('resources', r.id, rec); else S.create('resources', Object.assign({ authorId: me.id }, rec));
      m.close(); U.toast(r ? 'Đã cập nhật tài nguyên.' : 'Đã thêm tài nguyên.'); list();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) form(null);
    else if (t.dataset.edit) form(S.find('resources', t.dataset.edit));
    else if (t.dataset.del) {
      const r = S.find('resources', t.dataset.del);
      const used = S.all('helpRequests').some((h) => h.responses.some((x) => x.resourceId === r.id));
      if (await U.confirm({ title: 'Xóa tài nguyên', message: 'Xóa "' + r.title + '"?' + (used ? ' Tài nguyên này đã được đính kèm trong một số phản hồi; liên kết đó sẽ không còn hiển thị.' : ''), confirmText: 'Xóa', danger: true })) { S.remove('resources', r.id); U.toast('Đã xóa tài nguyên.'); list(); }
    }
  });

  U.withLoading(view, shell);
})();
