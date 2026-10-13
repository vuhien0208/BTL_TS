(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('farmer');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const seasons = () => Q.seasonsOfFarmer(me.id).filter((s) => s.status === 'active');
  const state = { seasonId: U.param('season') || '' };

  function ensureList(seasonId) {
    let cl = Q.checklistOf(seasonId);
    if (!cl) cl = S.create('checklists', { seasonId: seasonId, items: [], source: 'manual', updatedAt: CM.today() });
    return cl;
  }
  function saveItems(cl, items, source) {
    S.update('checklists', cl.id, { items: items, updatedAt: CM.today(), source: source || cl.source });
  }

  function shell() {
    const ss = seasons();
    if (!ss.length) { view.innerHTML = '<div class="card">' + U.empty('clipboard', 'Chưa có mùa vụ đang canh tác', 'Tạo mùa vụ để lập checklist công việc.', '<a class="btn" href="farmer-seasons.html">Tạo mùa vụ</a>') + '</div>'; return; }
    if (!ss.some((s) => s.id === state.seasonId)) state.seasonId = ss[0].id;
    view.innerHTML =
      '<div class="page-head"><div><h2>Checklist mùa vụ</h2><p>Lập danh sách công việc theo giai đoạn, đánh dấu tiến độ và để AI mô phỏng gợi ý checklist phù hợp với cây trồng.</p></div>' +
      '<div class="field" style="margin:0;min-width:240px"><label for="sel-season">Mùa vụ</label><select id="sel-season">' + U.optionList(ss.map((s) => ({ value: s.id, label: s.name })), state.seasonId) + '</select></div></div>' +
      '<div class="grid grid-2" style="align-items:start"><section class="card" aria-labelledby="h-cl"><div class="card-head"><h2 id="h-cl">Công việc đã lưu</h2><button class="btn btn-sm btn-outline" data-add>' + U.icon('plus') + ' Thêm việc</button></div><div id="cl"></div></section>' +
      '<div id="ai2"></div></div>';
    U.qs('#sel-season', view).addEventListener('change', (e) => { state.seasonId = e.target.value; history.replaceState(null, '', '?season=' + state.seasonId); drawList(); aiReset(); });
    drawList();
    mountAi();
  }

  function drawList() {
    const cl = Q.checklistOf(state.seasonId), box = U.qs('#cl', view), today = CM.today();
    const items = cl ? cl.items.slice().sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)) : [];
    if (!items.length) { box.innerHTML = U.empty('clipboard', 'Checklist đang trống', 'Thêm việc thủ công hoặc dùng AI mô phỏng ở bên cạnh để tạo checklist theo giai đoạn.'); return; }
    const pr = Q.progressOf(state.seasonId);
    box.innerHTML = '<div style="padding:14px 20px;border-bottom:1px solid var(--line)"><div class="row spread small" style="margin-bottom:4px"><span>Hoàn thành ' + pr.done + '/' + pr.total + ' việc</span><span>' + (pr.overdue ? '<strong style="color:var(--danger)">' + pr.overdue + ' việc trễ hạn</strong>' : 'Đúng tiến độ') + '</span></div><div class="progress ' + (pr.overdue ? 'warn' : '') + '" role="progressbar" aria-valuenow="' + pr.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ checklist"><span style="width:' + pr.pct + '%"></span></div></div>' +
      items.map((i) => {
        const late = i.status !== 'done' && i.dueDate < today;
        return '<div class="task ' + (i.status === 'done' ? 'done' : '') + '"><input type="checkbox" data-toggle="' + i.id + '"' + (i.status === 'done' ? ' checked' : '') + ' aria-label="Hoàn thành: ' + U.esc(i.title) + '">' +
          '<div><div class="t-title strong">' + U.esc(i.title) + '</div><div class="small muted">' + U.esc(i.desc || '') + '</div><div class="row small" style="margin-top:6px"><span style="color:' + (late ? 'var(--danger)' : 'var(--muted)') + '">' + U.fmtDate(i.dueDate) + (late ? ' · Trễ hạn' : '') + '</span>' + U.mapBadge(U.TASK_STATUS, i.status) + (i.stage ? '<span class="small muted">' + U.esc(i.stage) + '</span>' : '') + '</div></div>' +
          '<div class="actions" style="display:flex;gap:4px"><button class="btn btn-sm btn-ghost" data-edit="' + i.id + '" aria-label="Sửa ' + U.esc(i.title) + '">' + U.icon('edit') + '</button><button class="btn btn-sm btn-ghost" data-del="' + i.id + '" aria-label="Xóa ' + U.esc(i.title) + '">' + U.icon('trash') + '</button></div></div>';
      }).join('');
  }

  function itemForm(item) {
    const m = U.openModal({
      title: item ? 'Sửa công việc' : 'Thêm công việc',
      body: '<form id="cf" novalidate><div class="form-grid">' +
        U.field({ name: 'title', label: 'Tên công việc', required: true, value: item ? item.title : '', full: true }) +
        U.field({ name: 'desc', label: 'Mô tả', type: 'textarea', rows: 3, value: item ? item.desc : '', full: true }) +
        U.field({ name: 'dueDate', label: 'Ngày dự kiến', type: 'date', required: true, value: item ? item.dueDate : CM.today() }) +
        U.field({ name: 'status', label: 'Trạng thái', type: 'select', options: Object.keys(U.TASK_STATUS).map((k) => ({ value: k, label: U.TASK_STATUS[k][1] })), value: item ? item.status : 'todo' }) +
        U.field({ name: 'stage', label: 'Giai đoạn', type: 'select', options: CM.STAGES, value: item ? item.stage : (Q.season(state.seasonId) || {}).stage, full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="cf" type="submit">' + (item ? 'Lưu thay đổi' : 'Thêm việc') + '</button>',
    });
    const form = U.qs('#cf', m.el); U.clearErrorsOnInput(form);
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(form, { title: { label: 'Tên công việc', required: true, min: 3, max: 100 }, dueDate: { label: 'Ngày dự kiến', required: true } })) return;
      const d = U.formData(form), cl = ensureList(state.seasonId);
      let items = cl.items.slice();
      if (item) items = items.map((x) => (x.id === item.id ? Object.assign({}, x, d) : x));
      else items.push({ id: S.uid('ci'), title: d.title, desc: d.desc, dueDate: d.dueDate, status: d.status, stage: d.stage });
      saveItems(cl, items);
      m.close(); U.toast(item ? 'Đã cập nhật công việc.' : 'Đã thêm công việc.'); drawList();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    const cl = Q.checklistOf(state.seasonId);
    if (t.hasAttribute('data-add')) itemForm(null);
    else if (t.dataset.edit) itemForm(cl.items.find((i) => i.id === t.dataset.edit));
    else if (t.dataset.del) {
      if (await U.confirm({ title: 'Xóa công việc', message: 'Xóa công việc này khỏi checklist?', confirmText: 'Xóa', danger: true })) { saveItems(cl, cl.items.filter((i) => i.id !== t.dataset.del)); U.toast('Đã xóa công việc.'); drawList(); }
    }
  });
  view.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-toggle]'); if (!cb) return;
    const cl = Q.checklistOf(state.seasonId);
    saveItems(cl, cl.items.map((i) => (i.id === cb.dataset.toggle ? Object.assign({}, i, { status: cb.checked ? 'done' : 'todo' }) : i)));
    drawList();
  });

  /* ---------- AI-2 ---------- */
  let panel = null;
  function aiReset() { if (panel) panel.reset(); }
  function mountAi() {
    const host = U.qs('#ai2', view);
    const season = () => Q.season(state.seasonId);
    host.innerHTML =
      '<section class="card" aria-labelledby="h-ai2"><div class="card-head"><h2 id="h-ai2">Tạo checklist bằng AI mô phỏng</h2></div><div class="card-body">' +
      '<form id="aif" novalidate><div class="form-grid">' +
      U.field({ name: 'stage', label: 'Giai đoạn mùa vụ', type: 'select', options: CM.STAGES, blank: 'Chọn giai đoạn', value: (season() || {}).stage }) +
      U.field({ name: 'startDate', label: 'Ngày bắt đầu giai đoạn', type: 'date', value: CM.today(), help: 'Ngày dự kiến của từng việc được tính từ ngày này.' }) +
      '</div><p class="small muted" style="margin-bottom:12px">Cây trồng lấy theo mùa vụ đang chọn.</p></form><div id="aip"></div></div></section>';
    const form = U.qs('#aif', host);
    form.addEventListener('submit', (e) => e.preventDefault());
    form.elements.stage.addEventListener('change', () => { U.setError(form, 'stage', ''); });
    panel = U.aiPanel(U.qs('#aip', host), {
      title: 'Season Checklist Generator (AI-2)',
      intro: 'AI mô phỏng đề xuất danh sách công việc, ngày dự kiến và mô tả theo cây trồng và giai đoạn.',
      runLabel: 'Tạo checklist',
      acceptLabel: 'Chấp nhận & lưu vào mùa vụ',
      getInput() {
        const s = season();
        return { cropId: s ? s.cropId : '', stage: form.elements.stage.value, startDate: form.elements.startDate.value };
      },
      run: (input, attempt, opts) => CM.ai.generateChecklist(input, attempt, opts),
      renderResult(d) {
        return '<p class="strong">' + d.items.length + ' công việc cho ' + U.esc(d.crop) + ' – ' + U.esc(d.stage) + '</p><ul style="list-style:none;padding:0;margin:8px 0">' +
          d.items.map((i) => '<li style="padding:8px 0;border-bottom:1px dashed var(--line)"><div class="row spread"><strong>' + U.esc(i.title) + '</strong><span class="small muted">' + U.fmtDate(i.dueDate) + '</span></div><div class="small muted">' + U.esc(i.desc) + '</div></li>').join('') + '</ul>' +
          '<h4>Giải thích</h4><ul>' + d.explanation.map((x) => '<li>' + U.esc(x) + '</li>').join('') + '</ul>';
      },
      renderEditor(d) {
        return '<p class="small muted">Sửa tên, ngày và trạng thái trước khi lưu. Để xóa một việc, xóa trống tên việc đó.</p>' + d.items.map((i, k) =>
          '<div class="edit-row" data-row="' + k + '"><input type="text" value="' + U.esc(i.title) + '" aria-label="Tên việc ' + (k + 1) + '" data-f="title"><input type="date" value="' + i.dueDate + '" aria-label="Ngày việc ' + (k + 1) + '" data-f="dueDate"><select aria-label="Trạng thái việc ' + (k + 1) + '" data-f="status">' + U.optionList(Object.keys(U.TASK_STATUS).map((s) => ({ value: s, label: U.TASK_STATUS[s][1] })), i.status) + '</select><input type="text" class="full" value="' + U.esc(i.desc) + '" aria-label="Mô tả việc ' + (k + 1) + '" data-f="desc"></div>').join('');
      },
      readEditor(root, d) {
        const items = [];
        root.querySelectorAll('[data-row]').forEach((row, k) => {
          const g = (f) => row.querySelector('[data-f=' + f + ']').value.trim();
          if (!g('title')) return;
          items.push(Object.assign({}, d.items[k], { title: g('title'), dueDate: g('dueDate') || d.items[k].dueDate, status: g('status'), desc: g('desc') }));
        });
        if (!items.length) { U.toast('Checklist cần ít nhất một công việc.', 'warn'); return null; }
        return Object.assign({}, d, { items: items });
      },
      async onAccept(d, mode, input) {
        const cl = ensureList(state.seasonId);
        const same = cl.items.filter((i) => i.stage === d.stage && i.status !== 'done');
        let items = cl.items.slice();
        if (same.length) {
          const replace = await U.confirm({ title: 'Checklist đã có việc ở giai đoạn này', message: 'Đã có ' + same.length + ' việc chưa hoàn thành ở giai đoạn "' + d.stage + '". Thay thế chúng bằng checklist mới? Chọn "Giữ cả hai" để thêm vào cuối.', confirmText: 'Thay thế', cancelText: 'Giữ cả hai' });
          if (replace) items = items.filter((i) => !(i.stage === d.stage && i.status !== 'done'));
        }
        items = items.concat(d.items.map((i) => Object.assign({}, i, { id: S.uid('ci') })));
        saveItems(cl, items, 'ai-simulation');
        drawList();
        U.toast('Đã lưu checklist vào mùa vụ.');
        return mode === 'edited' ? 'Đã lưu bản chỉnh sửa vào checklist của mùa vụ.' : 'Đã lưu ' + d.items.length + ' công việc vào checklist của mùa vụ.';
      },
      onSupplement() { form.elements.stage.focus(); },
      onManual() { itemForm(null); },
      manualLabel: 'Thêm công việc thủ công',
    });
  }

  U.withLoading(view, shell);
})();
