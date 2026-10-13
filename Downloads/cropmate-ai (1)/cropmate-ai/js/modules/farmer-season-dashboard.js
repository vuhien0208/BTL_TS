(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('farmer');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');

  function render() {
    const farms = Q.farmsOf(me.id);
    const seasons = Q.seasonsOfFarmer(me.id);
    const active = seasons.filter((s) => s.status === 'active');
    const today = CM.today();
    const monthAgo = new Date(); monthAgo.setDate(monthAgo.getDate() - 30);
    const mAgo = monthAgo.toISOString().slice(0, 10);
    const logs = S.where('fieldLogs', (l) => l.farmerId === me.id && !l.archived);
    const reqs = S.where('helpRequests', (r) => r.farmerId === me.id);
    const seasonIds = seasons.map((s) => s.id);
    const items = [];
    S.all('checklists').filter((c) => seasonIds.includes(c.seasonId)).forEach((c) => c.items.forEach((i) => items.push(Object.assign({ seasonId: c.seasonId, listId: c.id }, i))));
    const open = items.filter((i) => i.status !== 'done');
    const overdue = open.filter((i) => i.dueDate && i.dueDate < today);
    const openReqs = reqs.filter(Q.isOpen);

    if (!farms.length) {
      view.innerHTML = '<div class="card">' + U.empty('leaf', 'Chưa có nông hộ nào', 'Tài khoản của bạn chưa gắn với nông hộ. Hãy liên hệ quản trị viên hoặc đăng ký lại.') + '</div>';
      return;
    }

    let h = '<div class="page-head"><div><h2>Xin chào, ' + U.esc(me.name) + '</h2><p>' + U.esc(farms[0].name) + ' · ' + U.esc(farms[0].address || 'Chưa cập nhật địa chỉ') + '</p></div>' +
      '<div class="row"><a class="btn btn-outline" href="farmer-field-log.html?new=1">' + U.icon('plus') + ' Ghi nhật ký</a><a class="btn" href="farmer-help-request.html?new=1">' + U.icon('lifebuoy') + ' Gửi yêu cầu hỗ trợ</a></div></div>';

    h += '<div class="grid grid-4" role="list">' +
      '<div class="card stat" role="listitem"><span class="num">' + active.length + '</span><span class="lbl">Mùa vụ đang canh tác</span></div>' +
      '<div class="card stat info" role="listitem"><span class="num">' + logs.filter((l) => l.date >= mAgo).length + '</span><span class="lbl">Nhật ký trong 30 ngày</span></div>' +
      '<div class="card stat warn" role="listitem"><span class="num">' + openReqs.length + '</span><span class="lbl">Yêu cầu hỗ trợ đang mở</span></div>' +
      '<div class="card stat ' + (overdue.length ? 'danger' : '') + '" role="listitem"><span class="num">' + overdue.length + '</span><span class="lbl">Công việc trễ hạn</span></div></div>';

    // mùa vụ
    h += '<h2 style="margin:28px 0 12px">Mùa vụ đang chạy</h2>';
    if (!active.length) {
      h += '<div class="card">' + U.empty('leaf', 'Chưa có mùa vụ đang canh tác', 'Tạo mùa vụ để bắt đầu ghi nhật ký và lập checklist.', '<a class="btn" href="farmer-seasons.html">Tạo mùa vụ</a>') + '</div>';
    } else {
      h += '<div class="card-grid">' + active.map((s) => {
        const pr = Q.progressOf(s.id), left = U.daysFromToday(s.endDate), fld = S.find('fields', s.fieldId);
        return '<article class="card card-pad stack" style="gap:10px"><div class="row spread"><h3>' + U.esc(s.name) + '</h3>' + U.mapBadge(U.SEASON_STATUS, s.status) + '</div>' +
          '<p class="small muted">' + U.esc(Q.cropName(s.cropId)) + ' · ' + U.esc(fld ? fld.name + ' (' + fld.area + ' ha)' : '—') + '</p>' +
          '<div class="row spread small"><span>Giai đoạn: <strong>' + U.esc(s.stage) + '</strong></span><span class="muted">' + (left >= 0 ? 'Còn ' + left + ' ngày' : 'Quá hạn ' + Math.abs(left) + ' ngày') + '</span></div>' +
          '<div><div class="row spread small" style="margin-bottom:4px"><span>Tiến độ checklist</span><span>' + (pr.total ? pr.done + '/' + pr.total + ' việc' : 'Chưa có checklist') + '</span></div><div class="progress ' + (pr.overdue ? 'warn' : '') + '" role="progressbar" aria-valuenow="' + pr.pct + '" aria-valuemin="0" aria-valuemax="100" aria-label="Tiến độ checklist ' + U.esc(s.name) + '"><span style="width:' + pr.pct + '%"></span></div></div>' +
          (pr.overdue ? '<p class="small" style="color:var(--danger)">' + pr.overdue + ' việc trễ hạn</p>' : '') +
          '<div class="row"><a class="btn btn-sm btn-outline" href="farmer-field-log.html?season=' + s.id + '">Nhật ký</a><a class="btn btn-sm btn-outline" href="farmer-checklist.html?season=' + s.id + '">Checklist</a></div></article>';
      }).join('') + '</div>';
    }

    // hai cột: việc sắp tới + phản hồi
    const upcoming = open.slice().sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1)).slice(0, 6);
    const replied = reqs.filter((r) => r.responses.length).sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1)).slice(0, 4);
    h += '<div class="grid grid-2" style="margin-top:28px">';
    h += '<section class="card" aria-labelledby="h-tasks"><div class="card-head"><h2 id="h-tasks">Việc cần làm</h2><a href="farmer-checklist.html" class="small">Xem checklist</a></div>';
    h += upcoming.length ? '<div>' + upcoming.map((i) => {
      const late = i.dueDate && i.dueDate < today;
      return '<div class="task' + '"><input type="checkbox" data-done="' + i.listId + '|' + i.id + '" aria-label="Đánh dấu hoàn thành: ' + U.esc(i.title) + '"><div><div class="t-title strong">' + U.esc(i.title) + '</div><div class="small muted">' + U.esc(Q.seasonName(i.seasonId)) + '</div></div><div class="small" style="text-align:right;color:' + (late ? 'var(--danger)' : 'var(--muted)') + '">' + U.fmtDate(i.dueDate) + (late ? '<br><strong>Trễ hạn</strong>' : '') + '</div></div>';
    }).join('') + '</div>' : U.empty('check', 'Không có việc tồn đọng', 'Bạn đã hoàn thành các việc trong checklist.');
    h += '</section>';

    h += '<section class="card" aria-labelledby="h-rep"><div class="card-head"><h2 id="h-rep">Phản hồi từ chuyên gia</h2><a href="farmer-help-request.html" class="small">Tất cả yêu cầu</a></div>';
    h += replied.length ? '<ul class="list">' + replied.map((r) => {
      const last = r.responses[r.responses.length - 1];
      return '<li><div><a class="strong" href="farmer-help-request.html?id=' + r.id + '">' + U.esc(r.title) + '</a><p class="small muted">' + U.esc(Q.userName(last.expertId)) + ' · ' + U.fmtDateTime(last.date) + '</p><p class="small">' + U.esc(last.text.length > 110 ? last.text.slice(0, 110) + '…' : last.text) + '</p></div>' + U.mapBadge(U.REQ_STATUS, r.status) + '</li>';
    }).join('') + '</ul>' : U.empty('lifebuoy', 'Chưa có phản hồi', 'Khi gửi yêu cầu hỗ trợ, phản hồi của chuyên gia sẽ hiển thị tại đây.', '<a class="btn" href="farmer-help-request.html?new=1">Gửi yêu cầu</a>');
    h += '</section></div>';

    // nhật ký gần đây
    const recent = logs.slice().sort((a, b) => (a.date < b.date ? 1 : -1)).slice(0, 5);
    h += '<section class="card" style="margin-top:20px" aria-labelledby="h-log"><div class="card-head"><h2 id="h-log">Nhật ký gần đây</h2><a href="farmer-field-log.html" class="small">Mở nhật ký</a></div>';
    h += recent.length ? '<div class="table-wrap"><table class="data"><thead><tr><th>Ngày</th><th>Mùa vụ</th><th>Hoạt động</th><th>Ghi chú</th></tr></thead><tbody>' + recent.map((l) => '<tr><td>' + U.fmtDate(l.date) + '</td><td>' + U.esc(Q.seasonName(l.seasonId)) + '</td><td>' + U.badge('plain', l.activity) + '</td><td>' + U.esc(l.note) + '</td></tr>').join('') + '</tbody></table></div>' : U.empty('book', 'Chưa có nhật ký', 'Hãy ghi hoạt động đầu tiên của mùa vụ.', '<a class="btn" href="farmer-field-log.html?new=1">Ghi nhật ký</a>');
    h += '</section>';

    view.innerHTML = h;
  }

  view.addEventListener('change', (e) => {
    const cb = e.target.closest('[data-done]');
    if (!cb) return;
    const parts = cb.dataset.done.split('|'), cl = S.find('checklists', parts[0]);
    if (!cl) return;
    cl.items.forEach((i) => { if (i.id === parts[1]) i.status = 'done'; });
    S.update('checklists', cl.id, { items: cl.items, updatedAt: CM.today() });
    U.toast('Đã đánh dấu hoàn thành công việc.');
    render();
  });

  U.withLoading(view, render);
})();
