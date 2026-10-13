(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('coordinator');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const now = new Date();
  const state = { y: now.getFullYear(), m: now.getMonth(), sel: CM.today(), farm: '', type: '' };
  const TYPES = [{ value: 'care', label: 'Chăm sóc' }, { value: 'inspection', label: 'Kiểm tra đồng ruộng' }, { value: 'meeting', label: 'Họp / tập huấn' }, { value: 'other', label: 'Khác' }];
  const typeLabel = (v) => (TYPES.find((t) => t.value === v) || { label: 'Khác' }).label;
  const pad = (x) => String(x).padStart(2, '0');
  const iso = (y, m, d) => y + '-' + pad(m + 1) + '-' + pad(d);

  /** Gộp sự kiện điều phối + công việc checklist của nông dân vào một lịch. */
  function itemsByDate() {
    const map = {}, today = CM.today();
    const push = (d, o) => { (map[d] = map[d] || []).push(o); };
    S.all('calendarEvents').filter((e) => (!state.farm || e.farmId === state.farm) && (!state.type || state.type === e.type)).forEach((e) => push(e.date, { kind: 'event', id: e.id, title: e.title, cls: e.type === 'meeting' ? 'meeting' : '', farmId: e.farmId, ev: e }));
    if (!state.type || state.type === 'task') {
      S.all('checklists').forEach((c) => {
        const s = Q.season(c.seasonId); if (!s || s.status !== 'active') return;
        if (state.farm && s.farmId !== state.farm) return;
        c.items.filter((i) => i.status !== 'done').forEach((i) => push(i.dueDate, { kind: 'task', title: i.title, cls: i.dueDate < today ? 'late' : 'task', farmId: s.farmId, season: s, late: i.dueDate < today }));
      });
    }
    return map;
  }

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Lịch hoạt động</h2><p>Lịch chăm sóc, kiểm tra và họp của HTX, kèm các công việc từ checklist của nông dân. Việc trễ hạn hiển thị màu đỏ.</p></div><button class="btn" data-new>' + U.icon('plus') + ' Thêm sự kiện</button></div>' +
      '<div class="card"><div class="toolbar"><div class="row"><button class="btn btn-outline btn-sm" data-nav="-1" aria-label="Tháng trước">‹</button><strong id="mlabel" style="min-width:130px;text-align:center" aria-live="polite"></strong><button class="btn btn-outline btn-sm" data-nav="1" aria-label="Tháng sau">›</button><button class="btn btn-ghost btn-sm" data-nav="0">Hôm nay</button></div>' +
      '<div class="field"><label for="flt-farm">Nông hộ</label><select id="flt-farm">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(S.all('farms').map((f) => ({ value: f.id, label: f.name }))), state.farm) + '</select></div>' +
      '<div class="field"><label for="flt-type">Loại</label><select id="flt-type">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: 'task', label: 'Việc của nông dân' }].concat(TYPES), state.type) + '</select></div></div>' +
      '<div id="grid" style="padding:8px 12px"></div></div>' +
      '<div class="split" style="margin-top:20px"><section class="card" aria-labelledby="h-day"><div class="card-head"><h2 id="h-day"></h2></div><div id="day"></div></section><section class="card" aria-labelledby="h-late"><div class="card-head"><h2 id="h-late">Việc trễ hạn</h2></div><div id="late"></div></section></div>';
    U.qs('#flt-farm', view).addEventListener('change', (e) => { state.farm = e.target.value; draw(); });
    U.qs('#flt-type', view).addEventListener('change', (e) => { state.type = e.target.value; draw(); });
    draw();
    if (U.param('new') === '1') { const f = U.param('farm'); history.replaceState(null, '', location.pathname); eventForm(null, f); }
  }

  function draw() {
    const map = itemsByDate(), first = new Date(state.y, state.m, 1), days = new Date(state.y, state.m + 1, 0).getDate();
    const offset = (first.getDay() + 6) % 7, today = CM.today();
    U.qs('#mlabel', view).textContent = 'Tháng ' + (state.m + 1) + ', ' + state.y;
    let h = '<table class="cal" role="grid" aria-label="Lịch tháng ' + (state.m + 1) + '/' + state.y + '"><thead><tr>' + ['T2', 'T3', 'T4', 'T5', 'T6', 'T7', 'CN'].map((d) => '<th scope="col">' + d + '</th>').join('') + '</tr></thead><tbody>';
    let d = 1 - offset;
    for (let w = 0; w < 6 && d <= days; w++) {
      h += '<tr>';
      for (let c = 0; c < 7; c++, d++) {
        if (d < 1 || d > days) { h += '<td class="out"></td>'; continue; }
        const key = iso(state.y, state.m, d), its = map[key] || [];
        h += '<td class="' + (key === today ? 'today ' : '') + (key === state.sel ? 'sel' : '') + '"><button type="button" class="daybtn" data-day="' + key + '" aria-label="Ngày ' + d + ', ' + its.length + ' mục"><span class="dn">' + d + '</span>' +
          its.slice(0, 2).map((i) => '<span class="ev ' + i.cls + '">' + U.esc(i.title) + '</span>').join('') + (its.length > 2 ? '<span class="ev more">+' + (its.length - 2) + ' mục</span>' : '') + (its.length ? '<span class="evdot" aria-hidden="true"></span>' : '') + '</button></td>';
      }
      h += '</tr>';
    }
    U.qs('#grid', view).innerHTML = h + '</tbody></table>';
    drawDay(map); drawLate();
  }

  function drawDay(map) {
    U.qs('#h-day', view).textContent = 'Ngày ' + U.fmtDate(state.sel);
    const its = (map || itemsByDate())[state.sel] || [], box = U.qs('#day', view);
    if (!its.length) { box.innerHTML = U.empty('calendar', 'Không có hoạt động', 'Thêm sự kiện cho ngày này.', '<button class="btn btn-sm" data-new>Thêm sự kiện</button>'); return; }
    box.innerHTML = '<ul class="list">' + its.map((i) => {
      const farm = i.farmId ? Q.farm(i.farmId) : null;
      if (i.kind === 'event') return '<li><div><strong>' + U.esc(i.title) + '</strong><p class="small muted">' + typeLabel(i.ev.type) + (farm ? ' · ' + U.esc(farm.name) : ' · Toàn HTX') + '</p>' + (i.ev.note ? '<p class="small">' + U.esc(i.ev.note) + '</p>' : '') + '</div><div class="row"><button class="btn btn-sm btn-ghost" data-edit="' + i.id + '" aria-label="Sửa">' + U.icon('edit') + '</button><button class="btn btn-sm btn-ghost" data-del="' + i.id + '" aria-label="Xóa">' + U.icon('trash') + '</button></div></li>';
      return '<li><div><strong>' + U.esc(i.title) + '</strong><p class="small muted">Việc của nông dân · ' + U.esc(i.season.name) + (farm ? ' · ' + U.esc(farm.name) : '') + '</p></div>' + (i.late ? U.badge('danger', 'Trễ hạn') : U.badge('info', 'Công việc')) + '</li>';
    }).join('') + '</ul>';
  }

  function drawLate() {
    const late = [], today = CM.today();
    S.all('checklists').forEach((c) => { const s = Q.season(c.seasonId); if (!s || s.status !== 'active') return; if (state.farm && s.farmId !== state.farm) return; c.items.filter((i) => i.status !== 'done' && i.dueDate < today).forEach((i) => late.push({ i: i, s: s })); });
    late.sort((a, b) => (a.i.dueDate < b.i.dueDate ? -1 : 1));
    U.qs('#late', view).innerHTML = late.length ? '<ul class="list">' + late.map((x) => { const f = Q.farm(x.s.farmId); return '<li><div><strong>' + U.esc(x.i.title) + '</strong><p class="small muted">' + U.esc(f ? f.name : '') + ' · ' + U.esc(x.s.name) + '</p></div><span class="small" style="color:var(--danger);white-space:nowrap">Trễ ' + Math.abs(U.daysFromToday(x.i.dueDate)) + ' ngày</span></li>'; }).join('') + '</ul>' : U.empty('check', 'Không có việc trễ hạn', 'Các nông hộ đang đúng tiến độ.');
  }

  function eventForm(ev, farmId) {
    const m = U.openModal({
      title: ev ? 'Sửa sự kiện' : 'Thêm sự kiện',
      body: '<form id="ef" novalidate><div class="form-grid">' +
        U.field({ name: 'title', label: 'Tiêu đề', required: true, value: ev ? ev.title : '', full: true }) +
        U.field({ name: 'date', label: 'Ngày', type: 'date', required: true, value: ev ? ev.date : state.sel }) +
        U.field({ name: 'type', label: 'Loại hoạt động', type: 'select', options: TYPES, value: ev ? ev.type : 'care' }) +
        U.field({ name: 'farmId', label: 'Nông hộ', type: 'select', options: S.all('farms').map((f) => ({ value: f.id, label: f.name })), blank: 'Toàn HTX', value: ev ? ev.farmId : farmId || '', full: true }) +
        U.field({ name: 'note', label: 'Ghi chú', type: 'textarea', rows: 3, value: ev ? ev.note : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="ef" type="submit">' + (ev ? 'Lưu thay đổi' : 'Thêm sự kiện') + '</button>',
    });
    const f = U.qs('#ef', m.el); U.clearErrorsOnInput(f);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(f, { title: { label: 'Tiêu đề', required: true, min: 3, max: 100 }, date: { label: 'Ngày', required: true } })) return;
      const d = U.formData(f);
      if (ev) S.update('calendarEvents', ev.id, d); else S.create('calendarEvents', Object.assign({ createdBy: me.id }, d));
      if (d.farmId) { const farm = Q.farm(d.farmId); if (farm && !ev) S.notify({ userId: farm.ownerId }, 'Lịch hoạt động mới', d.title + ' — ' + U.fmtDate(d.date), 'pages/farmer/farmer-season-dashboard.html'); }
      const dt = d.date.split('-'); state.y = +dt[0]; state.m = +dt[1] - 1; state.sel = d.date;
      m.close(); U.toast(ev ? 'Đã cập nhật sự kiện.' : 'Đã thêm sự kiện.'); draw();
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.dataset.day) { state.sel = t.dataset.day; draw(); }
    else if (t.dataset.nav !== undefined) {
      const n = +t.dataset.nav;
      if (n === 0) { state.y = now.getFullYear(); state.m = now.getMonth(); state.sel = CM.today(); }
      else { state.m += n; if (state.m < 0) { state.m = 11; state.y--; } if (state.m > 11) { state.m = 0; state.y++; } }
      draw();
    } else if (t.hasAttribute('data-new')) eventForm(null);
    else if (t.dataset.edit) eventForm(S.find('calendarEvents', t.dataset.edit));
    else if (t.dataset.del) { if (await U.confirm({ title: 'Xóa sự kiện', message: 'Xóa sự kiện này khỏi lịch?', confirmText: 'Xóa', danger: true })) { S.remove('calendarEvents', t.dataset.del); U.toast('Đã xóa sự kiện.'); draw(); } }
  });

  U.withLoading(view, shell);
})();
