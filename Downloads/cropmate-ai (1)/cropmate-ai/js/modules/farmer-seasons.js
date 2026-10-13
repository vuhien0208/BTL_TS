(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('farmer');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { tab: 'seasons', q: '', status: '' };

  const farm = () => Q.farmsOf(me.id)[0];
  const myFields = () => S.where('fields', (f) => Q.farmsOf(me.id).some((x) => x.id === f.farmId));
  const mySeasons = () => Q.seasonsOfFarmer(me.id);
  const cropOptions = () => S.where('crops', (c) => c.status === 'active').map((c) => ({ value: c.id, label: c.name }));

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Mùa vụ & thửa ruộng</h2><p>Quản lý thửa ruộng, tạo mùa vụ và theo dõi giai đoạn canh tác. Mùa vụ là cơ sở để ghi nhật ký, lập checklist và gửi yêu cầu hỗ trợ.</p></div>' +
      '<div class="row"><button class="btn btn-outline" data-new="field">' + U.icon('plus') + ' Thêm thửa ruộng</button><button class="btn" data-new="season">' + U.icon('plus') + ' Tạo mùa vụ</button></div></div>' +
      '<div class="tabs" role="tablist"><button class="tab" role="tab" data-tab="seasons">Mùa vụ</button><button class="tab" role="tab" data-tab="fields">Thửa ruộng</button></div>' +
      '<div id="tab-body"></div>';
    draw();
  }

  function draw() {
    U.qsa('.tab', view).forEach((t) => t.setAttribute('aria-selected', t.dataset.tab === state.tab ? 'true' : 'false'));
    const body = U.qs('#tab-body', view);
    if (state.tab === 'fields') return drawFields(body);
    drawSeasons(body);
  }

  function drawSeasons(body) {
    body.innerHTML = '<div class="card"><div class="toolbar">' +
      '<div class="field grow search-box"><label for="flt-q">Tìm mùa vụ</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tên mùa vụ, cây trồng…" value="' + U.esc(state.q) + '" style="margin-top:0"></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: 'active', label: 'Đang canh tác' }, { value: 'completed', label: 'Đã hoàn thành' }, { value: 'archived', label: 'Đã lưu trữ' }], state.status) + '</select></div></div><div id="list"></div></div>';
    U.qs('#flt-q', body).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-st', body).addEventListener('change', (e) => { state.status = e.target.value; list(); });
    list();
  }

  function list() {
    const box = U.qs('#list', view);
    let rows = mySeasons();
    if (state.status) rows = rows.filter((s) => s.status === state.status);
    else rows = rows.filter((s) => s.status !== 'archived' || state.status === 'archived');
    const q = U.norm(state.q);
    if (q) rows = rows.filter((s) => U.norm(s.name + ' ' + Q.cropName(s.cropId)).includes(q));
    rows.sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    if (!rows.length) {
      box.innerHTML = U.empty('leaf', S.all('seasons').length ? 'Không tìm thấy mùa vụ' : 'Chưa có mùa vụ', q || state.status ? 'Thử đổi từ khóa hoặc bộ lọc.' : 'Tạo mùa vụ đầu tiên cho thửa ruộng của bạn.', q || state.status ? '' : '<button class="btn" data-new="season">Tạo mùa vụ</button>');
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách mùa vụ</caption><thead><tr><th>Mùa vụ</th><th>Thửa ruộng</th><th>Thời gian</th><th>Giai đoạn</th><th>Trạng thái</th><th>Thao tác</th></tr></thead><tbody>' +
      rows.map((s) => {
        const f = S.find('fields', s.fieldId);
        return '<tr><td><strong>' + U.esc(s.name) + '</strong><span class="sub">' + U.esc(Q.cropName(s.cropId)) + '</span></td><td>' + U.esc(f ? f.name + ' · ' + f.area + ' ha' : '—') + '</td><td>' + U.fmtDate(s.startDate) + ' – ' + U.fmtDate(s.endDate) + '</td><td>' + U.esc(s.stage) + '</td><td>' + U.mapBadge(U.SEASON_STATUS, s.status) + '</td>' +
          '<td><div class="actions"><button class="btn btn-sm btn-outline" data-edit-season="' + s.id + '">' + U.icon('edit') + ' Sửa</button><a class="btn btn-sm btn-ghost" href="farmer-checklist.html?season=' + s.id + '">Checklist</a>' +
          (s.status !== 'archived' ? '<button class="btn btn-sm btn-ghost" data-archive-season="' + s.id + '">' + U.icon('archive') + ' Lưu trữ</button>' : '<button class="btn btn-sm btn-ghost" data-restore-season="' + s.id + '">Khôi phục</button>') + '</div></td></tr>';
      }).join('') + '</tbody></table></div>';
  }

  function drawFields(body) {
    const rows = myFields();
    body.innerHTML = '<div class="card">' + (rows.length ? '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách thửa ruộng</caption><thead><tr><th>Thửa ruộng</th><th>Diện tích</th><th>Cây trồng chính</th><th>Mùa vụ</th><th>Thao tác</th></tr></thead><tbody>' +
      rows.map((f) => {
        const n = mySeasons().filter((s) => s.fieldId === f.id).length;
        return '<tr><td><strong>' + U.esc(f.name) + '</strong></td><td>' + f.area + ' ha</td><td>' + U.esc(Q.cropName(f.cropId)) + '</td><td>' + n + '</td><td><div class="actions"><button class="btn btn-sm btn-outline" data-edit-field="' + f.id + '">' + U.icon('edit') + ' Sửa</button><button class="btn btn-sm btn-ghost" data-del-field="' + f.id + '">' + U.icon('trash') + ' Xóa</button></div></td></tr>';
      }).join('') + '</tbody></table></div>' : U.empty('map', 'Chưa có thửa ruộng', 'Thêm thửa ruộng trước khi tạo mùa vụ.', '<button class="btn" data-new="field">Thêm thửa ruộng</button>')) + '</div>';
  }

  /* ---- form thửa ruộng ---- */
  function fieldForm(f) {
    const m = U.openModal({
      title: f ? 'Sửa thửa ruộng' : 'Thêm thửa ruộng',
      body: '<form id="ff" novalidate><div class="form-grid">' +
        U.field({ name: 'name', label: 'Tên thửa ruộng', required: true, value: f ? f.name : '', placeholder: 'Ví dụ: Thửa A3' }) +
        U.field({ name: 'area', label: 'Diện tích (ha)', type: 'number', required: true, value: f ? f.area : '', attrs: 'step="0.01" min="0.01"' }) +
        U.field({ name: 'cropId', label: 'Cây trồng chính', type: 'select', options: cropOptions(), blank: 'Chọn cây trồng', required: true, value: f ? f.cropId : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="ff" type="submit">' + (f ? 'Lưu thay đổi' : 'Thêm thửa ruộng') + '</button>',
    });
    const form = U.qs('#ff', m.el); U.clearErrorsOnInput(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(form, {
        name: { label: 'Tên thửa ruộng', required: true, max: 60 },
        area: { label: 'Diện tích', required: true, custom: (v) => (!(parseFloat(v) > 0) ? 'Diện tích phải lớn hơn 0.' : parseFloat(v) > 1000 ? 'Diện tích quá lớn, hãy kiểm tra đơn vị (ha).' : '') },
        cropId: { label: 'Cây trồng', required: true },
      });
      if (!ok) return;
      const d = U.formData(form), rec = { name: d.name, area: parseFloat(d.area), cropId: d.cropId };
      if (f) S.update('fields', f.id, rec); else S.create('fields', Object.assign({ farmId: farm().id }, rec));
      m.close(); U.toast(f ? 'Đã cập nhật thửa ruộng.' : 'Đã thêm thửa ruộng.'); draw();
    });
  }

  /* ---- form mùa vụ ---- */
  function seasonForm(s) {
    const fields = myFields();
    if (!fields.length) { U.toast('Hãy thêm thửa ruộng trước khi tạo mùa vụ.', 'warn'); state.tab = 'fields'; draw(); return; }
    const m = U.openModal({
      title: s ? 'Sửa mùa vụ' : 'Tạo mùa vụ', size: 'lg',
      body: '<form id="sf" novalidate><div class="form-grid">' +
        U.field({ name: 'name', label: 'Tên mùa vụ', required: true, value: s ? s.name : '', placeholder: 'Ví dụ: Lúa Đông Xuân 2026-27', full: true }) +
        U.field({ name: 'fieldId', label: 'Thửa ruộng', type: 'select', options: fields.map((f) => ({ value: f.id, label: f.name + ' — ' + Q.cropName(f.cropId) })), blank: 'Chọn thửa ruộng', required: true, value: s ? s.fieldId : '', help: 'Cây trồng được lấy theo thửa ruộng.' }) +
        U.field({ name: 'stage', label: 'Giai đoạn hiện tại', type: 'select', options: CM.STAGES, required: true, value: s ? s.stage : CM.STAGES[0] }) +
        U.field({ name: 'startDate', label: 'Ngày bắt đầu', type: 'date', required: true, value: s ? s.startDate : CM.today() }) +
        U.field({ name: 'endDate', label: 'Ngày dự kiến kết thúc', type: 'date', required: true, value: s ? s.endDate : '' }) +
        U.field({ name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'active', label: 'Đang canh tác' }, { value: 'completed', label: 'Đã hoàn thành' }], value: s ? (s.status === 'archived' ? 'completed' : s.status) : 'active' }) +
        U.field({ name: 'note', label: 'Ghi chú', type: 'textarea', rows: 3, value: s ? s.note : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="sf" type="submit">' + (s ? 'Lưu thay đổi' : 'Tạo mùa vụ') + '</button>',
    });
    const form = U.qs('#sf', m.el); U.clearErrorsOnInput(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(form, {
        name: { label: 'Tên mùa vụ', required: true, min: 3, max: 80 },
        fieldId: { label: 'Thửa ruộng', required: true },
        startDate: { label: 'Ngày bắt đầu', required: true },
        endDate: { label: 'Ngày kết thúc', required: true, custom: (v, f) => (v && f.elements.startDate.value && v <= f.elements.startDate.value ? 'Ngày kết thúc phải sau ngày bắt đầu.' : '') },
      });
      if (!ok) return;
      const d = U.formData(form), fld = S.find('fields', d.fieldId);
      const rec = { name: d.name, fieldId: d.fieldId, farmId: fld.farmId, cropId: fld.cropId, stage: d.stage, startDate: d.startDate, endDate: d.endDate, status: d.status, note: d.note };
      if (s) S.update('seasons', s.id, rec); else S.create('seasons', rec);
      m.close(); U.toast(s ? 'Đã cập nhật mùa vụ.' : 'Đã tạo mùa vụ.'); draw();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button,a'); if (!t) return;
    if (t.dataset.tab) { state.tab = t.dataset.tab; draw(); }
    else if (t.dataset.new === 'field') fieldForm(null);
    else if (t.dataset.new === 'season') seasonForm(null);
    else if (t.dataset.editField) fieldForm(S.find('fields', t.dataset.editField));
    else if (t.dataset.editSeason) seasonForm(S.find('seasons', t.dataset.editSeason));
    else if (t.dataset.delField) {
      const f = S.find('fields', t.dataset.delField);
      if (mySeasons().some((s) => s.fieldId === f.id)) { U.toast('Không thể xóa thửa ruộng đang có mùa vụ. Hãy lưu trữ mùa vụ trước hoặc sửa thông tin thửa.', 'error'); return; }
      if (await U.confirm({ title: 'Xóa thửa ruộng', message: 'Xóa "' + f.name + '"? Thao tác này không thể hoàn tác.', confirmText: 'Xóa', danger: true })) { S.remove('fields', f.id); U.toast('Đã xóa thửa ruộng.'); draw(); }
    } else if (t.dataset.archiveSeason) {
      const s = S.find('seasons', t.dataset.archiveSeason);
      if (await U.confirm({ title: 'Lưu trữ mùa vụ', message: 'Lưu trữ "' + s.name + '"? Mùa vụ sẽ ẩn khỏi danh sách đang canh tác, dữ liệu nhật ký vẫn được giữ.', confirmText: 'Lưu trữ' })) { S.update('seasons', s.id, { status: 'archived' }); U.toast('Đã lưu trữ mùa vụ.'); draw(); }
    } else if (t.dataset.restoreSeason) { S.update('seasons', t.dataset.restoreSeason, { status: 'completed' }); U.toast('Đã khôi phục mùa vụ.'); draw(); }
  });

  U.withLoading(view, shell);
})();
