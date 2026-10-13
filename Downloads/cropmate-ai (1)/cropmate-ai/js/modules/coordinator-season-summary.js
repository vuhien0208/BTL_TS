(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('coordinator');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', status: '' };
  const ST = { draft: ['warn', 'Bản nháp'], final: ['ok', 'Đã chốt'] };

  function seasonStats(s) {
    const logs = S.where('fieldLogs', (l) => l.seasonId === s.id && !l.archived);
    const reqs = S.where('helpRequests', (r) => r.seasonId === s.id);
    return { logs: logs.length, reqs: reqs.length, solved: reqs.filter((r) => r.status === 'resolved').length, p: Q.progressOf(s.id) };
  }

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Tổng kết mùa vụ</h2><p>Theo dõi số liệu từng mùa vụ và lập báo cáo tổng kết. Số liệu lấy trực tiếp từ nhật ký, yêu cầu hỗ trợ và checklist.</p></div><button class="btn" data-new>' + U.icon('plus') + ' Tạo báo cáo</button></div>' +
      '<section class="card" aria-labelledby="h-s"><div class="card-head"><h2 id="h-s">Số liệu theo mùa vụ</h2></div><div id="seasons"></div></section>' +
      '<section class="card" style="margin-top:20px" aria-labelledby="h-r"><div class="card-head"><h2 id="h-r">Báo cáo tổng kết</h2></div><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm báo cáo</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tiêu đề, nội dung…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }, { value: 'draft', label: 'Bản nháp' }, { value: 'final', label: 'Đã chốt' }], state.status) + '</select></div></div><div id="reports"></div></section>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; reports(); }, 150));
    U.qs('#flt-st', view).addEventListener('change', (e) => { state.status = e.target.value; reports(); });
    seasonsTable(); reports();
  }

  function seasonsTable() {
    const rows = S.all('seasons').sort((a, b) => (a.startDate < b.startDate ? 1 : -1));
    U.qs('#seasons', view).innerHTML = rows.length ? '<div class="table-wrap"><table class="data"><caption class="sr-only">Số liệu mùa vụ</caption><thead><tr><th>Mùa vụ</th><th>Nông hộ</th><th>Giai đoạn</th><th>Nhật ký</th><th>Yêu cầu (đã giải quyết)</th><th>Checklist</th><th>Báo cáo</th></tr></thead><tbody>' + rows.map((s) => {
      const st = seasonStats(s), has = S.all('seasonSummaries').some((r) => r.seasonId === s.id), f = Q.farm(s.farmId);
      return '<tr><td><strong>' + U.esc(s.name) + '</strong><span class="sub">' + U.esc(Q.cropName(s.cropId)) + ' · ' + U.mapBadge(U.SEASON_STATUS, s.status).replace(/<[^>]+>/g, '') + '</span></td><td>' + U.esc(f ? f.name : '—') + '</td><td>' + U.esc(s.stage) + '</td><td>' + st.logs + '</td><td>' + st.reqs + ' (' + st.solved + ')</td><td>' + (st.p.total ? st.p.pct + '%' + (st.p.overdue ? ' · ' + st.p.overdue + ' trễ' : '') : '—') + '</td><td>' + (has ? U.badge('ok', 'Đã có') : '<button class="btn btn-sm btn-outline" data-new-for="' + s.id + '">Lập báo cáo</button>') + '</td></tr>';
    }).join('') + '</tbody></table></div>' : U.empty('leaf', 'Chưa có mùa vụ', 'Nông dân chưa tạo mùa vụ nào.');
  }

  function reports() {
    const q = U.norm(state.q), box = U.qs('#reports', view);
    const rows = S.all('seasonSummaries').filter((r) => !state.status || r.status === state.status).filter((r) => !q || U.norm(r.title + ' ' + r.content).includes(q)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (!rows.length) { box.innerHTML = U.empty('chart', q || state.status ? 'Không tìm thấy báo cáo' : 'Chưa có báo cáo nào', q || state.status ? 'Thử đổi từ khóa hoặc trạng thái.' : 'Tạo báo cáo từ bảng số liệu phía trên.', q || state.status ? '' : '<button class="btn" data-new>Tạo báo cáo</button>'); return; }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách báo cáo</caption><thead><tr><th>Báo cáo</th><th>Năng suất</th><th>Trạng thái</th><th>Ngày tạo</th><th>Thao tác</th></tr></thead><tbody>' + rows.map((r) =>
      '<tr><td><strong>' + U.esc(r.title) + '</strong><span class="sub">' + U.esc(Q.seasonName(r.seasonId)) + '</span></td><td>' + (r.yieldValue ? r.yieldValue + ' tấn/ha' : '—') + '</td><td>' + U.mapBadge(ST, r.status) + '</td><td>' + U.fmtDate(r.createdAt) + '</td><td><div class="actions"><button class="btn btn-sm btn-outline" data-view="' + r.id + '">' + U.icon('eye') + ' Xem</button><button class="btn btn-sm btn-ghost" data-edit="' + r.id + '">' + U.icon('edit') + ' Sửa</button><button class="btn btn-sm btn-ghost" data-del="' + r.id + '">' + U.icon('trash') + ' Xóa</button></div></td></tr>').join('') + '</tbody></table></div>';
  }

  function template(s) {
    const st = seasonStats(s), summaries = S.where('helpRequests', (r) => r.seasonId === s.id && r.aiSummary);
    return 'Mùa vụ ' + s.name + ' (' + Q.cropName(s.cropId) + ') từ ' + U.fmtDate(s.startDate) + ' đến ' + U.fmtDate(s.endDate) + ', hiện ở giai đoạn ' + s.stage + '.\n' +
      'Số liệu: ' + st.logs + ' bản ghi nhật ký; ' + st.reqs + ' yêu cầu hỗ trợ (' + st.solved + ' đã giải quyết); checklist hoàn thành ' + (st.p.total ? st.p.pct + '%' : 'chưa có') + (st.p.overdue ? ', ' + st.p.overdue + ' việc trễ hạn' : '') + '.\n' +
      (summaries.length ? 'Tóm tắt chuyên gia: ' + summaries[0].aiSummary.overview + '\n' : '') + 'Vấn đề nổi bật: \nĐề xuất cho vụ sau: ';
  }

  function form(r, seasonId) {
    const m = U.openModal({
      title: r ? 'Sửa báo cáo' : 'Tạo báo cáo tổng kết', size: 'lg',
      body: '<form id="rf" novalidate><div class="form-grid">' +
        U.field({ name: 'seasonId', label: 'Mùa vụ', type: 'select', options: S.all('seasons').map((s) => ({ value: s.id, label: s.name })), blank: 'Chọn mùa vụ', required: true, value: r ? r.seasonId : seasonId || '' }) +
        U.field({ name: 'status', label: 'Trạng thái', type: 'select', options: [{ value: 'draft', label: 'Bản nháp' }, { value: 'final', label: 'Đã chốt' }], value: r ? r.status : 'draft' }) +
        U.field({ name: 'title', label: 'Tiêu đề báo cáo', required: true, value: r ? r.title : '', full: true }) +
        U.field({ name: 'yieldValue', label: 'Năng suất (tấn/ha, nếu có)', type: 'number', value: r && r.yieldValue ? r.yieldValue : '', attrs: 'step="0.1" min="0"' }) +
        '<div class="field" style="justify-content:flex-end"><button type="button" class="btn btn-outline" data-fill>' + U.icon('refresh') + ' Điền mẫu từ dữ liệu mùa vụ</button></div>' +
        U.field({ name: 'content', label: 'Nội dung tổng kết', type: 'textarea', rows: 9, required: true, value: r ? r.content : '', full: true }) + '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="rf" type="submit">' + (r ? 'Lưu thay đổi' : 'Lưu báo cáo') + '</button>',
    });
    const f = U.qs('#rf', m.el); U.clearErrorsOnInput(f);
    const sel = f.elements.seasonId;
    function autofill() { const s = Q.season(sel.value); if (!s) { U.setError(f, 'seasonId', 'Chọn mùa vụ trước khi điền mẫu.'); return; } if (!f.elements.title.value) f.elements.title.value = 'Báo cáo tổng kết ' + s.name; f.elements.content.value = template(s); }
    U.qs('[data-fill]', m.el).addEventListener('click', autofill);
    f.addEventListener('submit', (e) => {
      e.preventDefault();
      if (!U.validate(f, { seasonId: { label: 'Mùa vụ', required: true }, title: { label: 'Tiêu đề', required: true, min: 5, max: 120 }, content: { label: 'Nội dung', required: true, min: 20 }, yieldValue: { label: 'Năng suất', custom: (v) => (v && (isNaN(+v) || +v < 0) ? 'Năng suất phải là số không âm.' : '') } })) return;
      const d = U.formData(f), rec = { seasonId: d.seasonId, title: d.title, content: d.content, status: d.status, yieldValue: d.yieldValue ? +d.yieldValue : 0 };
      if (r) S.update('seasonSummaries', r.id, rec); else S.create('seasonSummaries', Object.assign({ createdBy: me.id, createdAt: CM.today() }, rec));
      m.close(); U.toast(r ? 'Đã cập nhật báo cáo.' : 'Đã lưu báo cáo.'); seasonsTable(); reports();
    });
  }

  function viewReport(r) {
    const ai = S.where('helpRequests', (x) => x.seasonId === r.seasonId && x.aiSummary);
    U.openModal({
      title: r.title, size: 'lg', autofocus: false,
      body: '<div class="row" style="margin-bottom:12px">' + U.mapBadge(ST, r.status) + '<span class="small muted">' + U.esc(Q.seasonName(r.seasonId)) + ' · ' + U.fmtDate(r.createdAt) + ' · ' + U.esc(Q.userName(r.createdBy)) + '</span></div>' + (r.yieldValue ? '<p><strong>Năng suất:</strong> ' + r.yieldValue + ' tấn/ha</p>' : '') + '<p style="margin-top:10px">' + U.nl2br(r.content) + '</p>' +
        (ai.length ? '<h3 style="margin:18px 0 8px">Tóm tắt từ chuyên gia <span class="tag-ai">AI mô phỏng</span></h3>' + ai.map((x) => '<div class="quote small" style="margin-bottom:8px"><strong>' + U.esc(x.title) + '</strong><br>' + U.esc(x.aiSummary.overview) + '</div>').join('') : ''),
      footer: '<button class="btn" data-close>Đóng</button>',
    });
  }

  view.addEventListener('click', async (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) form(null);
    else if (t.dataset.newFor) form(null, t.dataset.newFor);
    else if (t.dataset.view) viewReport(S.find('seasonSummaries', t.dataset.view));
    else if (t.dataset.edit) form(S.find('seasonSummaries', t.dataset.edit));
    else if (t.dataset.del) { if (await U.confirm({ title: 'Xóa báo cáo', message: 'Xóa báo cáo này vĩnh viễn?', confirmText: 'Xóa', danger: true })) { S.remove('seasonSummaries', t.dataset.del); U.toast('Đã xóa báo cáo.'); seasonsTable(); reports(); } }
  });

  U.withLoading(view, shell);
})();
