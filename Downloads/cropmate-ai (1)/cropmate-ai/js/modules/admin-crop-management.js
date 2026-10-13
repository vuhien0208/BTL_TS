(function () {
  const CM = window.CM, U = CM.ui, S = CM.store;
  const me = CM.auth.guard('admin');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const CATS = ['Lương thực', 'Rau màu', 'Cây công nghiệp', 'Cây ăn quả', 'Khác'];
  const state = { q: '', cat: '', status: '' };

  function usage(c) {
    return { fields: S.where('fields', (f) => f.cropId === c.id).length, seasons: S.where('seasons', (s) => s.cropId === c.id).length, reqs: S.where('helpRequests', (r) => r.cropId === c.id).length };
  }

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Danh mục cây trồng</h2><p>Cây trồng đang áp dụng sẽ xuất hiện trong biểu mẫu của nông dân, chuyên gia và bộ sinh checklist AI.</p></div><button class="btn" data-new>' + U.icon('plus') + ' Thêm cây trồng</button></div>' +
      '<div class="card"><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm cây trồng</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tên, mô tả…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-cat">Nhóm</label><select id="flt-cat">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(CATS), state.cat) + '</select></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: 'active', label: 'Đang áp dụng' }, { value: 'inactive', label: 'Tạm dừng' }], state.status) + '</select></div></div><div id="list"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-cat', view).addEventListener('change', (e) => { state.cat = e.target.value; list(); });
    U.qs('#flt-st', view).addEventListener('change', (e) => { state.status = e.target.value; list(); });
    list();
  }

  function list() {
    const q = U.norm(state.q), box = U.qs('#list', view);
    const rows = S.all('crops').filter((c) => !state.cat || c.category === state.cat).filter((c) => !state.status || c.status === state.status).filter((c) => !q || U.norm(c.name + ' ' + c.description).includes(q));
    if (!rows.length) { box.innerHTML = U.empty('sprout', 'Không tìm thấy cây trồng', 'Thử đổi từ khóa hoặc bộ lọc.', '<button class="btn" data-new>Thêm cây trồng</button>'); return; }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh mục cây trồng</caption><thead><tr><th>Cây trồng</th><th>Nhóm</th><th>Chu kỳ</th><th>Đang dùng</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>' + rows.map((c) => {
      const u = usage(c);
      return '<tr><td><strong>' + U.esc(c.name) + '</strong><span class="sub">' + U.esc(c.description) + '</span></td><td>' + U.esc(c.category) + '</td><td>' + c.cycleDays + ' ngày</td><td>' + u.fields + ' thửa · ' + u.seasons + ' mùa vụ</td><td>' + U.badge(c.status === 'active' ? 'ok' : '', c.status === 'active' ? 'Đang áp dụng' : 'Tạm dừng') + '</td><td><div class="actions"><button class="btn btn-sm btn-outline" data-edit="' + c.id + '">' + U.icon('edit') + ' Sửa</button><button class="btn btn-sm btn-ghost" data-toggle="' + c.id + '">' + (c.status === 'active' ? 'Tạm dừng' : 'Áp dụng lại') + '</button><button class="btn btn-sm btn-ghost" data-del="' + c.id + '">' + U.icon('trash') + ' Xóa</button></div></td></tr>';
    }).join('') + '</tbody></table></div><p class="small muted" style="padding:10px 20px">Hiển thị ' + rows.length + ' cây trồng.</p>';
  }

  function form(c) {
    const m = U.openModal({
      title: c ? 'Sửa cây trồng' : 'Thêm cây trồng',
      body: '<form id="cf" novalidate><div class="form-grid">' +
        U.field({ name: 'name', label: 'Tên cây trồng', required: true, value: c ? c.name : '' }) +
        U.field({ name: 'category', label: 'Nhóm', type: 'select', options: CATS, value: c ? c.category : 'Rau màu' }) +
        U.field({ name: 'cycleDays', label: 'Chu kỳ (ngày)', type: 'number', required: true, value: c ? c.cycleDays : '', attrs: 'min="1" max="1500"' }) +
        U.field({ name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'active', label: 'Đang áp dụng' }, { value: 'inactive', label: 'Tạm dừng' }], value: c ? c.status : 'active' }) +
        U.field({ name: 'description', label: 'Mô tả', type: 'textarea', rows: 3, value: c ? c.description : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="cf" type="submit">' + (c ? 'Lưu thay đổi' : 'Thêm cây trồng') + '</button>',
    });
    const f = U.qs('#cf', m.el); U.clearErrorsOnInput(f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(f, {
        name: { label: 'Tên cây trồng', required: true, min: 2, max: 50, custom: (v) => (S.all('crops').some((x) => U.norm(x.name) === U.norm(v) && (!c || x.id !== c.id)) ? 'Cây trồng này đã có trong danh mục.' : '') },
        cycleDays: { label: 'Chu kỳ', required: true, custom: (v) => (!(parseInt(v, 10) >= 1 && parseInt(v, 10) <= 1500) ? 'Chu kỳ từ 1 đến 1500 ngày.' : '') },
      })) return;
      const d = U.formData(f), rec = { name: d.name, category: d.category, cycleDays: parseInt(d.cycleDays, 10), status: d.status, description: d.description };
      if (c) S.update('crops', c.id, rec); else S.create('crops', rec);
      m.close(); U.toast(c ? 'Đã cập nhật cây trồng.' : 'Đã thêm cây trồng.'); list();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) form(null);
    else if (t.dataset.edit) form(S.find('crops', t.dataset.edit));
    else if (t.dataset.toggle) { const c = S.find('crops', t.dataset.toggle); S.update('crops', c.id, { status: c.status === 'active' ? 'inactive' : 'active' }); U.toast(c.status === 'active' ? 'Đã tạm dừng cây trồng.' : 'Đã áp dụng lại cây trồng.'); list(); }
    else if (t.dataset.del) {
      const c = S.find('crops', t.dataset.del), u = usage(c);
      if (u.fields || u.seasons || u.reqs) { U.toast('"' + c.name + '" đang được dùng (' + u.fields + ' thửa, ' + u.seasons + ' mùa vụ, ' + u.reqs + ' yêu cầu). Hãy chọn "Tạm dừng" thay vì xóa.', 'error'); return; }
      if (await U.confirm({ title: 'Xóa cây trồng', message: 'Xóa "' + c.name + '" khỏi danh mục?', confirmText: 'Xóa', danger: true })) { S.remove('crops', c.id); U.toast('Đã xóa cây trồng.'); list(); }
    }
  });

  U.withLoading(view, shell);
})();
