(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('farmer');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', season: U.param('season') || '', activity: '', from: '', to: '', archived: false };

  const seasons = () => Q.seasonsOfFarmer(me.id).filter((s) => s.status !== 'archived');

  function shell() {
    const ss = seasons();
    view.innerHTML =
      '<div class="page-head"><div><h2>Nhật ký canh tác</h2><p>Ghi lại từng hoạt động trên đồng ruộng. Chuyên gia sẽ xem nhật ký liên quan khi xử lý yêu cầu hỗ trợ của bạn.</p></div>' +
      '<button class="btn" data-new>' + U.icon('plus') + ' Thêm nhật ký</button></div>' +
      '<div class="card"><div class="toolbar">' +
      '<div class="field grow search-box"><label for="flt-q">Tìm trong ghi chú</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Ví dụ: bón phân, rầy…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-season">Mùa vụ</label><select id="flt-season">' + U.optionList([{ value: '', label: 'Tất cả mùa vụ' }].concat(ss.map((s) => ({ value: s.id, label: s.name }))), state.season) + '</select></div>' +
      '<div class="field"><label for="flt-act">Hoạt động</label><select id="flt-act">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(CM.ACTIVITIES), state.activity) + '</select></div>' +
      '<div class="field"><label for="flt-from">Từ ngày</label><input type="date" id="flt-from" value="' + state.from + '"></div>' +
      '<div class="field"><label for="flt-to">Đến ngày</label><input type="date" id="flt-to" value="' + state.to + '"></div>' +
      '<label class="check field"><input type="checkbox" id="flt-arc"' + (state.archived ? ' checked' : '') + '> Xem đã lưu trữ</label></div><div id="list"></div></div>';
    const bind = (id, key, ev) => U.qs('#' + id, view).addEventListener(ev || 'change', (e) => { state[key] = e.target.type === 'checkbox' ? e.target.checked : e.target.value; list(); });
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    bind('flt-season', 'season'); bind('flt-act', 'activity'); bind('flt-from', 'from'); bind('flt-to', 'to'); bind('flt-arc', 'archived');
    list();
    if (U.param('new') === '1') { history.replaceState(null, '', location.pathname + (state.season ? '?season=' + state.season : '')); logForm(null); }
  }

  function filtered() {
    const ids = Q.seasonsOfFarmer(me.id).map((s) => s.id), q = U.norm(state.q);
    return S.where('fieldLogs', (l) => l.farmerId === me.id && ids.includes(l.seasonId))
      .filter((l) => !!l.archived === state.archived)
      .filter((l) => !state.season || l.seasonId === state.season)
      .filter((l) => !state.activity || l.activity === state.activity)
      .filter((l) => !state.from || l.date >= state.from)
      .filter((l) => !state.to || l.date <= state.to)
      .filter((l) => !q || U.norm(l.note + ' ' + l.activity).includes(q))
      .sort((a, b) => (a.date < b.date ? 1 : -1));
  }

  function list() {
    const box = U.qs('#list', view), rows = filtered();
    const hasFilter = state.q || state.season || state.activity || state.from || state.to;
    if (!rows.length) {
      box.innerHTML = U.empty('book', hasFilter ? 'Không có nhật ký phù hợp' : state.archived ? 'Chưa có nhật ký lưu trữ' : 'Chưa có nhật ký nào', hasFilter ? 'Thử bỏ bớt bộ lọc để xem nhiều kết quả hơn.' : 'Ghi hoạt động đầu tiên để bắt đầu theo dõi mùa vụ.', hasFilter ? '' : '<button class="btn" data-new>Thêm nhật ký</button>');
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách nhật ký canh tác</caption><thead><tr><th>Ngày</th><th>Mùa vụ</th><th>Hoạt động</th><th>Ghi chú</th><th>Ảnh</th><th>Thao tác</th></tr></thead><tbody>' +
      rows.map((l) => '<tr><td>' + U.fmtDate(l.date) + '</td><td>' + U.esc(Q.seasonName(l.seasonId)) + '</td><td>' + U.badge('plain', l.activity) + '</td><td style="min-width:240px">' + U.esc(l.note) + '</td><td>' + (l.images && l.images.length ? '<div class="thumbs">' + l.images.slice(0, 2).map((s) => '<img src="' + s + '" alt="Ảnh nhật ký" data-zoom style="width:44px;height:44px">').join('') + '</div>' : '<span class="muted">—</span>') + '</td>' +
        '<td><div class="actions"><button class="btn btn-sm btn-outline" data-edit="' + l.id + '">' + U.icon('edit') + ' Sửa</button>' +
        (l.archived ? '<button class="btn btn-sm btn-ghost" data-restore="' + l.id + '">Khôi phục</button>' : '<button class="btn btn-sm btn-ghost" data-archive="' + l.id + '">' + U.icon('archive') + ' Lưu trữ</button>') +
        '<button class="btn btn-sm btn-ghost" data-del="' + l.id + '">' + U.icon('trash') + ' Xóa</button></div></td></tr>').join('') + '</tbody></table></div>' +
      '<p class="small muted" style="padding:10px 20px">Hiển thị ' + rows.length + ' bản ghi.</p>';
  }

  function logForm(l) {
    const ss = seasons();
    if (!ss.length) { U.toast('Bạn cần có mùa vụ đang canh tác để ghi nhật ký.', 'warn'); return; }
    const m = U.openModal({
      title: l ? 'Sửa nhật ký' : 'Thêm nhật ký canh tác',
      body: '<form id="lf" novalidate><div class="form-grid">' +
        U.field({ name: 'seasonId', label: 'Mùa vụ', type: 'select', options: ss.map((s) => ({ value: s.id, label: s.name })), blank: 'Chọn mùa vụ', required: true, value: l ? l.seasonId : (state.season || (ss.length === 1 ? ss[0].id : '')) }) +
        U.field({ name: 'date', label: 'Ngày thực hiện', type: 'date', required: true, value: l ? l.date : CM.today(), attrs: 'max="' + CM.today() + '"' }) +
        U.field({ name: 'activity', label: 'Hoạt động', type: 'select', options: CM.ACTIVITIES, required: true, value: l ? l.activity : '', blank: 'Chọn hoạt động', full: true }) +
        U.field({ name: 'note', label: 'Ghi chú', type: 'textarea', required: true, value: l ? l.note : '', rows: 4, placeholder: 'Ghi rõ liều lượng, vị trí, thời tiết, quan sát…', full: true }) +
        '<div class="field full"><span class="label">Ảnh minh họa (không bắt buộc)</span><div id="pick"></div></div></div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="lf" type="submit">' + (l ? 'Lưu thay đổi' : 'Lưu nhật ký') + '</button>',
    });
    const form = U.qs('#lf', m.el); U.clearErrorsOnInput(form);
    const pick = U.imagePicker(U.qs('#pick', m.el), l ? l.images : [], 3);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(form, {
        seasonId: { label: 'Mùa vụ', required: true },
        date: { label: 'Ngày thực hiện', required: true, custom: (v) => (v > CM.today() ? 'Ngày thực hiện không được ở tương lai.' : '') },
        activity: { label: 'Hoạt động', required: true },
        note: { label: 'Ghi chú', required: true, min: 5, max: 600 },
      });
      if (!ok) return;
      const d = U.formData(form), rec = { seasonId: d.seasonId, date: d.date, activity: d.activity, note: d.note, images: pick.get() };
      const saved = l ? S.update('fieldLogs', l.id, rec) : S.create('fieldLogs', Object.assign({ farmerId: me.id, archived: false }, rec));
      if (!saved) { U.toast('Không lưu được: bộ nhớ trình duyệt đã đầy. Hãy xóa bớt ảnh.', 'error'); return; }
      m.close(); U.toast(l ? 'Đã cập nhật nhật ký.' : 'Đã lưu nhật ký.'); list();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) logForm(null);
    else if (t.dataset.edit) logForm(S.find('fieldLogs', t.dataset.edit));
    else if (t.dataset.archive) { if (await U.confirm({ title: 'Lưu trữ nhật ký', message: 'Lưu trữ bản ghi này? Bạn có thể khôi phục trong mục "Xem đã lưu trữ".', confirmText: 'Lưu trữ' })) { S.update('fieldLogs', t.dataset.archive, { archived: true }); U.toast('Đã lưu trữ nhật ký.'); list(); } }
    else if (t.dataset.restore) { S.update('fieldLogs', t.dataset.restore, { archived: false }); U.toast('Đã khôi phục nhật ký.'); list(); }
    else if (t.dataset.del) { if (await U.confirm({ title: 'Xóa nhật ký', message: 'Xóa bản ghi này vĩnh viễn? Không thể hoàn tác.', confirmText: 'Xóa', danger: true })) { S.remove('fieldLogs', t.dataset.del); U.toast('Đã xóa nhật ký.'); list(); } }
  });

  U.withLoading(view, shell);
})();
