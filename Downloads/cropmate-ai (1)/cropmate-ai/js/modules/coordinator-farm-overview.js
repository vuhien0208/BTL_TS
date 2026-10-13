(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('coordinator');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', health: '' };

  /** Tính chỉ số theo dõi cho từng nông hộ (dữ liệu liên thông với Farmer và Expert). */
  function metrics() {
    const today = CM.today();
    return S.all('farms').map((f) => {
      const seasons = S.where('seasons', (s) => s.farmId === f.id);
      const active = seasons.filter((s) => s.status === 'active');
      const fields = S.where('fields', (x) => x.farmId === f.id);
      const reqs = S.where('helpRequests', (r) => r.farmerId === f.ownerId);
      const openReqs = reqs.filter(Q.isOpen);
      let overdue = 0, done = 0, total = 0;
      active.forEach((s) => { const p = Q.progressOf(s.id); overdue += p.overdue; done += p.done; total += p.total; });
      const urgent = openReqs.filter((r) => r.priority === 'urgent' || r.priority === 'high').length;
      let health = 'ok';
      if (f.status !== 'active') health = 'paused';
      else if (openReqs.some((r) => r.priority === 'urgent') || overdue >= 2) health = 'priority';
      else if (overdue >= 1 || urgent) health = 'late';
      return { farm: f, owner: Q.user(f.ownerId), fields: fields, area: fields.reduce((a, x) => a + x.area, 0), active: active, openReqs: openReqs, urgent: urgent, overdue: overdue, pct: total ? Math.round((done / total) * 100) : 0, total: total, health: health, today: today };
    });
  }

  function shell() {
    const ms = metrics();
    const sum = (k) => ms.reduce((a, m) => a + (typeof m[k] === 'number' ? m[k] : m[k].length), 0);
    const priority = ms.filter((m) => m.health === 'priority' || m.health === 'late').sort((a, b) => (a.health === 'priority' ? -1 : 1) - (b.health === 'priority' ? -1 : 1));
    const byStatus = Object.keys(U.REQ_STATUS).map((k) => ({ label: U.REQ_STATUS[k][1], value: S.all('helpRequests').filter((r) => r.status === k).length }));

    view.innerHTML =
      '<div class="page-head"><div><h2>Tổng quan nông hộ</h2><p>Theo dõi mùa vụ, tiến độ công việc và yêu cầu hỗ trợ của các nông hộ trong HTX.</p></div><a class="btn" href="coordinator-calendar.html?new=1">' + U.icon('calendar') + ' Lên lịch hoạt động</a></div>' +
      '<div class="grid grid-4" role="list"><div class="card stat" role="listitem"><span class="num">' + ms.filter((m) => m.farm.status === 'active').length + '/' + ms.length + '</span><span class="lbl">Nông hộ đang hoạt động</span></div>' +
      '<div class="card stat info" role="listitem"><span class="num">' + sum('active') + '</span><span class="lbl">Mùa vụ đang canh tác</span></div>' +
      '<div class="card stat warn" role="listitem"><span class="num">' + sum('openReqs') + '</span><span class="lbl">Yêu cầu hỗ trợ đang mở</span></div>' +
      '<div class="card stat danger" role="listitem"><span class="num">' + sum('overdue') + '</span><span class="lbl">Công việc trễ hạn</span></div></div>' +
      '<div class="split" style="margin-top:20px"><section class="card" aria-labelledby="h-pri"><div class="card-head"><h2 id="h-pri">Cần ưu tiên xử lý</h2></div>' +
      (priority.length ? '<ul class="list">' + priority.map((m) => '<li><div><strong>' + U.esc(m.farm.name) + '</strong><p class="small muted">' + (m.overdue ? m.overdue + ' việc trễ hạn' : '') + (m.overdue && m.openReqs.length ? ' · ' : '') + (m.openReqs.length ? m.openReqs.length + ' yêu cầu đang mở' + (m.urgent ? ' (' + m.urgent + ' ưu tiên cao)' : '') : '') + '</p></div><div class="row">' + U.mapBadge(U.FARM_HEALTH, m.health) + '<button class="btn btn-sm btn-outline" data-detail="' + m.farm.id + '">Chi tiết</button></div></li>').join('') + '</ul>' : U.empty('check', 'Không có nông hộ cần ưu tiên', 'Tất cả nông hộ đang đúng tiến độ.')) + '</section>' +
      '<section class="card" aria-labelledby="h-st"><div class="card-head"><h2 id="h-st">Yêu cầu theo trạng thái</h2></div><div class="card-body">' + U.bars(byStatus) + '</div></section></div>' +
      '<div class="card" style="margin-top:20px"><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm nông hộ</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tên nông hộ, chủ hộ, địa chỉ…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-h">Trạng thái</label><select id="flt-h">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(Object.keys(U.FARM_HEALTH).map((k) => ({ value: k, label: U.FARM_HEALTH[k][1] }))), state.health) + '</select></div></div><div id="list"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-h', view).addEventListener('change', (e) => { state.health = e.target.value; list(); });
    list();
  }

  function list() {
    const q = U.norm(state.q), box = U.qs('#list', view);
    const rows = metrics().filter((m) => !state.health || m.health === state.health).filter((m) => !q || U.norm(m.farm.name + ' ' + (m.owner ? m.owner.name : '') + ' ' + m.farm.address).includes(q));
    if (!rows.length) { box.innerHTML = U.empty('map', 'Không tìm thấy nông hộ', 'Thử đổi từ khóa hoặc trạng thái.'); return; }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách nông hộ</caption><thead><tr><th>Nông hộ</th><th>Diện tích</th><th>Mùa vụ</th><th>Tiến độ checklist</th><th>Yêu cầu mở</th><th>Trạng thái</th><th></th></tr></thead><tbody>' +
      rows.map((m) => '<tr><td><strong>' + U.esc(m.farm.name) + '</strong><span class="sub">' + U.esc(m.owner ? m.owner.name : '—') + ' · ' + U.esc(m.farm.address) + '</span></td><td>' + m.area.toFixed(1) + ' ha<span class="sub">' + m.fields.length + ' thửa</span></td><td>' + m.active.length + ' đang canh tác</td>' +
        '<td style="min-width:150px">' + (m.total ? '<div class="progress ' + (m.overdue ? 'warn' : '') + '"><span style="width:' + m.pct + '%"></span></div><span class="sub">' + m.pct + '%' + (m.overdue ? ' · ' + m.overdue + ' trễ hạn' : '') + '</span>' : '<span class="muted">Chưa có</span>') + '</td><td>' + m.openReqs.length + '</td><td>' + U.mapBadge(U.FARM_HEALTH, m.health) + '</td>' +
        '<td><button class="btn btn-sm btn-outline" data-detail="' + m.farm.id + '">' + U.icon('eye') + ' Chi tiết</button></td></tr>').join('') + '</tbody></table></div><p class="small muted" style="padding:10px 20px">Hiển thị ' + rows.length + ' nông hộ.</p>';
  }

  function detail(farmId) {
    const m = metrics().find((x) => x.farm.id === farmId); if (!m) return;
    const seasons = S.where('seasons', (s) => s.farmId === farmId).sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    const reqs = S.where('helpRequests', (r) => r.farmerId === m.farm.ownerId).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    const lateItems = [];
    seasons.filter((s) => s.status === 'active').forEach((s) => { const cl = Q.checklistOf(s.id); if (cl) cl.items.filter((i) => i.status !== 'done' && i.dueDate < CM.today()).forEach((i) => lateItems.push({ s: s, i: i })); });
    U.openModal({
      title: m.farm.name, size: 'lg', autofocus: false,
      body: '<dl class="kv"><dt>Chủ hộ</dt><dd>' + U.esc(m.owner ? m.owner.name : '—') + (m.owner && m.owner.phone ? ' · ' + U.esc(m.owner.phone) : '') + '</dd><dt>Địa chỉ</dt><dd>' + U.esc(m.farm.address) + '</dd><dt>Tình trạng</dt><dd>' + U.mapBadge(U.FARM_HEALTH, m.health) + '</dd></dl>' +
        '<h3 style="margin:18px 0 8px">Mùa vụ</h3>' + (seasons.length ? '<div class="table-wrap"><table class="data" style="min-width:480px"><thead><tr><th>Mùa vụ</th><th>Giai đoạn</th><th>Tiến độ</th><th>Trạng thái</th></tr></thead><tbody>' + seasons.map((s) => { const p = Q.progressOf(s.id); return '<tr><td><strong>' + U.esc(s.name) + '</strong><span class="sub">' + U.esc(Q.cropName(s.cropId)) + ' · đến ' + U.fmtDate(s.endDate) + '</span></td><td>' + U.esc(s.stage) + '</td><td>' + (p.total ? p.done + '/' + p.total + (p.overdue ? ' · ' + p.overdue + ' trễ' : '') : '—') + '</td><td>' + U.mapBadge(U.SEASON_STATUS, s.status) + '</td></tr>'; }).join('') + '</tbody></table></div>' : '<p class="muted">Chưa có mùa vụ.</p>') +
        '<h3 style="margin:18px 0 8px">Công việc trễ hạn</h3>' + (lateItems.length ? '<ul class="list" style="border:1px solid var(--line);border-radius:8px">' + lateItems.map((x) => '<li><div><strong>' + U.esc(x.i.title) + '</strong><p class="small muted">' + U.esc(x.s.name) + '</p></div><span class="small" style="color:var(--danger)">Hạn ' + U.fmtDate(x.i.dueDate) + '</span></li>').join('') + '</ul>' : '<p class="muted">Không có công việc trễ hạn.</p>') +
        '<h3 style="margin:18px 0 8px">Yêu cầu hỗ trợ</h3>' + (reqs.length ? '<ul class="list" style="border:1px solid var(--line);border-radius:8px">' + reqs.map((r) => '<li><div><strong>' + U.esc(r.title) + '</strong><p class="small muted">' + U.esc(Q.seasonName(r.seasonId)) + ' · ' + (r.expertId ? 'Chuyên gia: ' + U.esc(Q.userName(r.expertId)) : 'Chưa có chuyên gia') + ' · ' + r.responses.length + ' phản hồi</p></div><div class="row">' + U.mapBadge(U.PRIORITY, r.priority) + U.mapBadge(U.REQ_STATUS, r.status) + '</div></li>').join('') + '</ul>' : '<p class="muted">Chưa có yêu cầu hỗ trợ.</p>'),
      footer: '<a class="btn btn-outline" href="coordinator-calendar.html?new=1&farm=' + farmId + '">' + U.icon('calendar') + ' Lên lịch cho nông hộ</a><button class="btn" data-close>Đóng</button>',
    });
  }

  view.addEventListener('click', (e) => { const b = e.target.closest('[data-detail]'); if (b) detail(b.dataset.detail); });
  U.withLoading(view, shell);
})();
