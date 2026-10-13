(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('expert');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', status: '', priority: '', crop: '', mine: false };
  const PRI_W = { urgent: 0, high: 1, medium: 2, low: 3 };

  function shell() {
    const all = S.all('helpRequests');
    const cnt = (st) => all.filter((r) => r.status === st).length;
    view.innerHTML =
      '<div class="page-head"><div><h2>Hàng chờ yêu cầu hỗ trợ</h2><p>Tiếp nhận, phân tích và phản hồi yêu cầu từ nông dân. Yêu cầu khẩn cấp luôn được xếp lên đầu.</p></div></div>' +
      '<div class="grid grid-4" id="stats" role="list"></div>' +
      '<div class="card" style="margin-top:20px"><div class="toolbar">' +
      '<div class="field grow search-box"><label for="flt-q">Tìm yêu cầu</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tiêu đề, nông dân, mô tả…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(Object.keys(U.REQ_STATUS).map((k) => ({ value: k, label: U.REQ_STATUS[k][1] }))), state.status) + '</select></div>' +
      '<div class="field"><label for="flt-pr">Mức ưu tiên</label><select id="flt-pr">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(CM.PRIORITIES), state.priority) + '</select></div>' +
      '<div class="field"><label for="flt-crop">Cây trồng</label><select id="flt-crop">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(S.all('crops').map((c) => ({ value: c.id, label: c.name }))), state.crop) + '</select></div>' +
      '<label class="check field"><input type="checkbox" id="flt-mine"' + (state.mine ? ' checked' : '') + '> Chỉ yêu cầu của tôi</label></div><div id="list"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    [['flt-st', 'status'], ['flt-pr', 'priority'], ['flt-crop', 'crop']].forEach((p) => U.qs('#' + p[0], view).addEventListener('change', (e) => { state[p[1]] = e.target.value; list(); }));
    U.qs('#flt-mine', view).addEventListener('change', (e) => { state.mine = e.target.checked; list(); });
    stats(all); list();
  }

  function stats(all) {
    const c = (st) => all.filter((r) => r.status === st).length;
    U.qs('#stats', view).innerHTML =
      '<div class="card stat warn" role="listitem"><span class="num">' + c('pending') + '</span><span class="lbl">Chờ tiếp nhận</span></div>' +
      '<div class="card stat info" role="listitem"><span class="num">' + c('processing') + '</span><span class="lbl">Đang xử lý</span></div>' +
      '<div class="card stat" role="listitem"><span class="num">' + c('resolved') + '</span><span class="lbl">Đã hoàn thành</span></div>' +
      '<div class="card stat danger" role="listitem"><span class="num">' + all.filter((r) => Q.isOpen(r) && r.priority === 'urgent').length + '</span><span class="lbl">Khẩn cấp đang mở</span></div>';
  }

  function list() {
    const q = U.norm(state.q), box = U.qs('#list', view);
    const rows = S.all('helpRequests')
      .filter((r) => !state.status || r.status === state.status)
      .filter((r) => !state.priority || r.priority === state.priority)
      .filter((r) => !state.crop || r.cropId === state.crop)
      .filter((r) => !state.mine || r.expertId === me.id)
      .filter((r) => !q || U.norm(r.title + ' ' + r.description + ' ' + Q.userName(r.farmerId)).includes(q))
      .sort((a, b) => {
        const oa = Q.isOpen(a) ? 0 : 1, ob = Q.isOpen(b) ? 0 : 1;
        if (oa !== ob) return oa - ob;
        if (PRI_W[a.priority] !== PRI_W[b.priority]) return PRI_W[a.priority] - PRI_W[b.priority];
        return a.createdAt < b.createdAt ? 1 : -1;
      });
    if (!rows.length) {
      const f = q || state.status || state.priority || state.crop || state.mine;
      box.innerHTML = U.empty('inbox', f ? 'Không có yêu cầu phù hợp' : 'Hàng chờ đang trống', f ? 'Thử bỏ bớt bộ lọc.' : 'Khi nông dân gửi yêu cầu, chúng sẽ xuất hiện ở đây.');
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Hàng chờ yêu cầu hỗ trợ</caption><thead><tr><th>Yêu cầu</th><th>Nông dân</th><th>Cây trồng</th><th>Ưu tiên</th><th>Trạng thái</th><th>Phụ trách</th><th>Gửi lúc</th><th>Thao tác</th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td style="min-width:230px"><a class="strong" href="expert-request-detail.html?id=' + r.id + '">' + U.esc(r.title) + '</a><span class="sub">' + U.esc(U.CAT_LABEL[r.category] || '') + (r.aiResult ? ' · có gợi ý AI' : '') + '</span></td><td>' + U.esc(Q.userName(r.farmerId)) + '</td><td>' + U.esc(Q.cropName(r.cropId)) + '</td><td>' + U.mapBadge(U.PRIORITY, r.priority) + '</td><td>' + U.mapBadge(U.REQ_STATUS, r.status) + '</td><td>' + (r.expertId ? U.esc(Q.userName(r.expertId)) : '<span class="muted">—</span>') + '</td><td>' + U.fmtDateTime(r.createdAt) + '</td>' +
        '<td><div class="actions">' + (r.status === 'pending' ? '<button class="btn btn-sm" data-take="' + r.id + '">Nhận xử lý</button>' : '') + '<a class="btn btn-sm btn-outline" href="expert-request-detail.html?id=' + r.id + '">' + U.icon('eye') + ' Chi tiết</a></div></td></tr>').join('') + '</tbody></table></div>' +
      '<p class="small muted" style="padding:10px 20px">Hiển thị ' + rows.length + ' yêu cầu.</p>';
  }

  view.addEventListener('click', async (e) => {
    const b = e.target.closest('[data-take]'); if (!b) return;
    const r = S.find('helpRequests', b.dataset.take);
    if (!r || r.status !== 'pending') { U.toast('Yêu cầu này đã được người khác tiếp nhận.', 'warn'); shell(); return; }
    if (!(await U.confirm({ title: 'Nhận xử lý yêu cầu', message: 'Bạn sẽ là người phụ trách "' + r.title + '". Trạng thái chuyển sang "Đang xử lý".', confirmText: 'Nhận xử lý' }))) return;
    S.update('helpRequests', r.id, { status: 'processing', expertId: me.id, updatedAt: new Date().toISOString() });
    S.notify({ userId: r.farmerId }, 'Yêu cầu đã được tiếp nhận', me.name + ' đã nhận xử lý "' + r.title + '".', 'pages/farmer/farmer-help-request.html?id=' + r.id);
    U.toast('Đã nhận xử lý yêu cầu.'); stats(S.all('helpRequests')); list();
  });

  U.withLoading(view, shell);
})();
