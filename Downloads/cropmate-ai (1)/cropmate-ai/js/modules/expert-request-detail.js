(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('expert');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const id = U.param('id');

  function summaryHtml(d) {
    const ul = (arr) => '<ul>' + arr.map((x) => '<li>' + U.esc(x) + '</li>').join('') + '</ul>';
    return '<p>' + U.esc(d.overview) + '</p><h4>Hoạt động đã thực hiện</h4>' + ul(d.done) + '<h4>Vấn đề nổi bật</h4>' + ul(d.issues) + '<h4>Công việc còn tồn đọng</h4>' + ul(d.backlog) + '<h4>Đề xuất theo dõi tiếp theo</h4>' + ul(d.follow) +
      '<p class="small muted" style="margin-top:10px">' + U.esc(d.basis || '') + '</p>' +
      (d.explanation ? '<h4>Giải thích</h4>' + ul(d.explanation) : '');
  }

  function render() {
    const r = S.find('helpRequests', id);
    if (!r) { view.innerHTML = '<div class="card">' + U.empty('inbox', 'Không tìm thấy yêu cầu', 'Yêu cầu có thể đã bị xóa hoặc đường dẫn không đúng.', '<a class="btn" href="expert-request-queue.html">Về hàng chờ</a>') + '</div>'; return; }
    const farmer = Q.user(r.farmerId), season = Q.season(r.seasonId), farm = season ? Q.farm(season.farmId) : null;
    const logs = season ? S.where('fieldLogs', (l) => l.seasonId === season.id && !l.archived).sort((a, b) => (a.date < b.date ? 1 : -1)) : [];
    const canRespond = Q.isOpen(r) && (!r.expertId || r.expertId === me.id);
    const resources = S.all('resources').filter((x) => !x.cropId || x.cropId === r.cropId);

    view.innerHTML =
      '<p style="margin-bottom:12px"><a href="expert-request-queue.html">← Về hàng chờ</a></p>' +
      '<div class="page-head"><div><h2>' + U.esc(r.title) + '</h2><p>Gửi bởi ' + U.esc(farmer ? farmer.name : '—') + ' · ' + U.fmtDateTime(r.createdAt) + '</p></div><div class="row">' + U.mapBadge(U.PRIORITY, r.priority) + U.mapBadge(U.REQ_STATUS, r.status) + (r.status === 'pending' ? '<button class="btn" data-take>Nhận xử lý</button>' : '') + '</div></div>' +
      '<div class="split"><div class="stack">' +
      '<section class="card"><div class="card-head"><h2>Thông tin yêu cầu</h2></div><div class="card-body"><dl class="kv"><dt>Nông dân</dt><dd>' + U.esc(farmer ? farmer.name : '—') + (farmer && farmer.phone ? ' · ' + U.esc(farmer.phone) : '') + '</dd><dt>Nông hộ</dt><dd>' + U.esc(farm ? farm.name + ' — ' + farm.address : '—') + '</dd>' +
      '<dt>Cây trồng</dt><dd>' + U.esc(Q.cropName(r.cropId)) + ' · giai đoạn ' + U.esc(r.stage) + '</dd><dt>Nhóm vấn đề</dt><dd>' + U.esc(U.CAT_LABEL[r.category] || '—') + '</dd><dt>Phụ trách</dt><dd>' + (r.expertId ? U.esc(Q.userName(r.expertId)) : '<span class="muted">Chưa có</span>') + '</dd><dt>Mô tả</dt><dd>' + U.nl2br(r.description) + '</dd>' +
      (r.images.length ? '<dt>Ảnh</dt><dd><div class="thumbs">' + r.images.map((s) => '<img src="' + s + '" alt="Ảnh nông dân gửi" data-zoom>').join('') + '</div></dd>' : '') + '</dl>' +
      (r.aiResult ? '<h3 style="margin:18px 0 8px">Gợi ý AI-1 từ nông dân <span class="tag-ai">Mô phỏng</span></h3><div class="quote small">Nhóm: <strong>' + U.esc(U.CAT_LABEL[r.aiResult.category] || '') + '</strong> · Mức độ: <strong>' + U.esc((U.PRIORITY[r.aiResult.severity] || [0, ''])[1]) + '</strong> · Tin cậy mô phỏng ' + r.aiResult.confidence + '% (' + (r.aiResult.mode === 'edited' ? 'đã chỉnh sửa' : 'đã chấp nhận') + '). Chỉ mang tính tham khảo.</div>' : '') + '</div></section>' +
      '<section class="card"><div class="card-head"><h2>Trao đổi & phản hồi</h2></div><div class="card-body">' +
      (r.responses.length ? '<ol class="timeline">' + r.responses.map((x) => { const res = x.resourceId ? S.find('resources', x.resourceId) : null; return '<li><div class="row spread"><strong>' + U.esc(Q.userName(x.expertId)) + '</strong><span class="small muted">' + U.fmtDateTime(x.date) + '</span></div><p>' + U.nl2br(x.text) + '</p>' + (res ? '<p class="small">Đính kèm: <a href="' + U.esc(res.url) + '" target="_blank" rel="noopener">' + U.esc(res.title) + '</a></p>' : '') + '<p style="margin-top:4px">' + U.mapBadge(U.REQ_STATUS, x.status) + '</p></li>'; }).join('') + '</ol>' : '<p class="muted" style="margin-bottom:14px">Chưa có phản hồi nào.</p>') +
      (canRespond ? '<form id="rf" novalidate><div class="form-grid">' +
        U.field({ name: 'text', label: 'Nội dung tư vấn', type: 'textarea', rows: 4, required: true, placeholder: 'Nhận định, hướng xử lý, lưu ý an toàn…', full: true }) +
        U.field({ name: 'status', label: 'Cập nhật trạng thái', type: 'select', options: [{ value: 'processing', label: 'Đang xử lý (cần theo dõi thêm)' }, { value: 'resolved', label: 'Đã giải quyết' }, { value: 'rejected', label: 'Từ chối (thiếu thông tin / ngoài phạm vi)' }], value: 'processing' }) +
        U.field({ name: 'resourceId', label: 'Đính kèm tài liệu (không bắt buộc)', type: 'select', options: resources.map((x) => ({ value: x.id, label: x.title })), blank: 'Không đính kèm' }) +
        '</div><button class="btn" type="submit">' + U.icon('send') + ' Gửi phản hồi</button></form>' :
        '<div class="alert info">' + U.icon('alert') + '<div>' + (!Q.isOpen(r) ? 'Yêu cầu đã đóng (' + U.REQ_STATUS[r.status][1].toLowerCase() + '), không thể gửi thêm phản hồi.' : 'Yêu cầu đang do ' + U.esc(Q.userName(r.expertId)) + ' phụ trách. Bạn chỉ có thể xem.') + '</div></div>') +
      '</div></section></div>' +
      '<aside class="stack">' +
      '<section class="card"><div class="card-head"><h2>Mùa vụ liên quan</h2></div><div class="card-body">' + (season ? '<p class="strong">' + U.esc(season.name) + '</p><p class="small muted">' + U.esc(Q.cropName(season.cropId)) + ' · ' + U.esc(season.stage) + ' · ' + U.fmtDate(season.startDate) + ' – ' + U.fmtDate(season.endDate) + '</p>' + (function () { const p = Q.progressOf(season.id); return p.total ? '<div class="progress ' + (p.overdue ? 'warn' : '') + '" style="margin-top:10px"><span style="width:' + p.pct + '%"></span></div><p class="small muted" style="margin-top:4px">Checklist ' + p.done + '/' + p.total + (p.overdue ? ' · ' + p.overdue + ' trễ hạn' : '') + '</p>' : '<p class="small muted" style="margin-top:8px">Chưa có checklist.</p>'; })() : '<p class="muted">Không còn dữ liệu mùa vụ.</p>') + '</div></section>' +
      '<section class="card"><div class="card-head"><h2>Nhật ký liên quan</h2><span class="small muted">' + logs.length + ' bản ghi</span></div>' +
      (logs.length ? '<ul class="list">' + logs.slice(0, 6).map((l) => '<li><div><span class="small muted">' + U.fmtDate(l.date) + '</span> ' + U.badge('plain', l.activity) + '<p class="small" style="margin-top:4px">' + U.esc(l.note) + '</p></div></li>').join('') + '</ul>' : U.empty('book', 'Chưa có nhật ký', 'Nông dân chưa ghi nhật ký cho mùa vụ này.')) + '</section>' +
      '<div id="ai3"></div><section class="card" id="saved" hidden></section></aside></div>';

    drawSaved(r);
    mountAi(r);
    bind(r);
  }

  function drawSaved(r) {
    const box = U.qs('#saved', view);
    if (!r.aiSummary) { box.hidden = true; return; }
    box.hidden = false;
    box.innerHTML = '<div class="card-head"><h2>Tóm tắt đã lưu</h2><span class="tag-ai">AI mô phỏng</span></div><div class="card-body ai-result">' + summaryHtml(r.aiSummary) + '<p class="small muted" style="margin-top:10px">Lưu bởi ' + U.esc(Q.userName(r.aiSummary.by)) + ' lúc ' + U.fmtDateTime(r.aiSummary.savedAt) + (r.aiSummary.mode === 'edited' ? ' (đã chỉnh sửa)' : '') + '</p></div>';
  }

  function mountAi(r) {
    const lines = (t) => t.split('\n').map((x) => x.trim()).filter(Boolean);
    U.aiPanel(U.qs('#ai3', view), {
      title: 'Tóm tắt diễn biến mùa vụ (AI-3)',
      intro: 'AI mô phỏng đọc nhật ký canh tác, yêu cầu hỗ trợ và checklist của mùa vụ để tóm tắt diễn biến.',
      runLabel: 'Tóm tắt mùa vụ',
      acceptLabel: 'Chấp nhận & lưu vào hồ sơ yêu cầu',
      getInput: () => ({ seasonId: r.seasonId }),
      run: (input, attempt, opts) => CM.ai.summarizeSeason(input, attempt, opts),
      renderResult: summaryHtml,
      renderEditor(d) {
        const ta = (name, label, arr) => U.field({ name: name, label: label, type: 'textarea', rows: 4, value: arr.join('\n'), full: true });
        return U.field({ name: 'edOverview', label: 'Tổng quan', type: 'textarea', rows: 3, value: d.overview, full: true }) + ta('edDone', 'Hoạt động đã thực hiện (mỗi dòng một ý)', d.done) + ta('edIssues', 'Vấn đề nổi bật', d.issues) + ta('edBacklog', 'Công việc tồn đọng', d.backlog) + ta('edFollow', 'Đề xuất theo dõi', d.follow);
      },
      readEditor(root, d) {
        const g = (n) => root.querySelector('[name=' + n + ']').value;
        if (!g('edOverview').trim()) { U.toast('Phần tổng quan không được để trống.', 'warn'); return null; }
        return Object.assign({}, d, { overview: g('edOverview').trim(), done: lines(g('edDone')), issues: lines(g('edIssues')), backlog: lines(g('edBacklog')), follow: lines(g('edFollow')) });
      },
      onAccept(d, mode) {
        const saved = Object.assign({}, d, { mode: mode, savedAt: new Date().toISOString(), by: me.id, simulated: true });
        const upd = S.update('helpRequests', r.id, { aiSummary: saved, updatedAt: new Date().toISOString() });
        if (upd) { r.aiSummary = saved; drawSaved(r); }
        else U.toast('Không lưu được tóm tắt.', 'error');
        return 'Đã lưu bản tóm tắt vào hồ sơ yêu cầu.';
      },
      onSupplement() { const t = U.qs('[name=text]', view); if (t) t.focus(); },
      onManual() { const t = U.qs('[name=text]', view); if (t) { t.focus(); t.scrollIntoView({ block: 'center' }); } },
      manualLabel: 'Tự viết nhận định',
    });
  }

  function bind(r) {
    const take = U.qs('[data-take]', view);
    if (take) take.addEventListener('click', async () => {
      if (!(await U.confirm({ title: 'Nhận xử lý yêu cầu', message: 'Bạn sẽ là người phụ trách yêu cầu này.', confirmText: 'Nhận xử lý' }))) return;
      const cur = S.find('helpRequests', r.id);
      if (cur.status !== 'pending') { U.toast('Yêu cầu đã được người khác tiếp nhận.', 'warn'); render(); return; }
      S.update('helpRequests', r.id, { status: 'processing', expertId: me.id, updatedAt: new Date().toISOString() });
      S.notify({ userId: r.farmerId }, 'Yêu cầu đã được tiếp nhận', me.name + ' đã nhận xử lý "' + r.title + '".', 'pages/farmer/farmer-help-request.html?id=' + r.id);
      U.toast('Đã nhận xử lý yêu cầu.'); render();
    });
    const form = U.qs('#rf', view);
    if (!form) return;
    U.clearErrorsOnInput(form);
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!U.validate(form, { text: { label: 'Nội dung tư vấn', required: true, min: 15, max: 1500 } })) return;
      const d = U.formData(form), cur = S.find('helpRequests', r.id);
      if (cur.expertId && cur.expertId !== me.id) { U.toast('Yêu cầu đã được chuyên gia khác tiếp nhận.', 'warn'); render(); return; }
      if (d.status !== 'processing' && !(await U.confirm({ title: d.status === 'resolved' ? 'Đóng yêu cầu' : 'Từ chối yêu cầu', message: 'Trạng thái "' + U.REQ_STATUS[d.status][1] + '" sẽ đóng yêu cầu, bạn không thể phản hồi thêm. Tiếp tục?', confirmText: 'Gửi phản hồi' }))) return;
      const now = new Date().toISOString();
      const resp = { id: S.uid('rs'), expertId: me.id, text: d.text, status: d.status, date: now, resourceId: d.resourceId || null };
      S.update('helpRequests', r.id, { responses: cur.responses.concat([resp]), status: d.status, expertId: me.id, updatedAt: now });
      S.notify({ userId: r.farmerId }, 'Chuyên gia đã phản hồi', me.name + ' đã gửi tư vấn cho "' + r.title + '" (' + U.REQ_STATUS[d.status][1].toLowerCase() + ').', 'pages/farmer/farmer-help-request.html?id=' + r.id);
      U.toast('Đã gửi phản hồi và cập nhật trạng thái.'); render();
    });
  }

  U.withLoading(view, render);
})();
