(function () {
  const CM = window.CM, U = CM.ui, S = CM.store, Q = CM.q;
  const me = CM.auth.guard('farmer');
  if (!me) return;
  U.mountShell(me);
  const view = U.qs('#view');
  const state = { q: '', status: '' };

  const seasons = () => Q.seasonsOfFarmer(me.id).filter((s) => s.status !== 'archived');
  const mine = () => S.where('helpRequests', (r) => r.farmerId === me.id);

  function shell() {
    view.innerHTML =
      '<div class="page-head"><div><h2>Yêu cầu hỗ trợ</h2><p>Gửi vấn đề trên đồng ruộng cho chuyên gia. Bạn có thể dùng AI mô phỏng để gợi ý nhóm vấn đề trước khi gửi.</p></div>' +
      '<button class="btn" data-new>' + U.icon('plus') + ' Tạo yêu cầu</button></div>' +
      '<div class="card"><div class="toolbar"><div class="field grow search-box"><label for="flt-q">Tìm yêu cầu</label>' + U.icon('search') + '<input type="text" id="flt-q" placeholder="Tiêu đề, mô tả…" value="' + U.esc(state.q) + '"></div>' +
      '<div class="field"><label for="flt-st">Trạng thái</label><select id="flt-st">' + U.optionList([{ value: '', label: 'Tất cả' }].concat(Object.keys(U.REQ_STATUS).map((k) => ({ value: k, label: U.REQ_STATUS[k][1] }))), state.status) + '</select></div></div><div id="list"></div></div>';
    U.qs('#flt-q', view).addEventListener('input', U.debounce((e) => { state.q = e.target.value; list(); }, 150));
    U.qs('#flt-st', view).addEventListener('change', (e) => { state.status = e.target.value; list(); });
    list();
    const id = U.param('id');
    if (U.param('new') === '1') { history.replaceState(null, '', location.pathname); requestForm(null); }
    else if (id && S.find('helpRequests', id)) { detail(id); }
  }

  function list() {
    const box = U.qs('#list', view), q = U.norm(state.q);
    const rows = mine().filter((r) => !state.status || r.status === state.status).filter((r) => !q || U.norm(r.title + ' ' + r.description).includes(q)).sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
    if (!rows.length) {
      const f = q || state.status;
      box.innerHTML = U.empty('lifebuoy', f ? 'Không có yêu cầu phù hợp' : 'Bạn chưa gửi yêu cầu nào', f ? 'Thử đổi từ khóa hoặc trạng thái.' : 'Khi cây trồng gặp vấn đề, hãy gửi yêu cầu để chuyên gia hỗ trợ.', f ? '' : '<button class="btn" data-new>Tạo yêu cầu</button>');
      return;
    }
    box.innerHTML = '<div class="table-wrap"><table class="data"><caption class="sr-only">Danh sách yêu cầu hỗ trợ</caption><thead><tr><th>Yêu cầu</th><th>Nhóm</th><th>Ưu tiên</th><th>Trạng thái</th><th>Phản hồi</th><th>Gửi lúc</th><th></th></tr></thead><tbody>' +
      rows.map((r) => '<tr><td style="min-width:220px"><strong>' + U.esc(r.title) + '</strong><span class="sub">' + U.esc(Q.seasonName(r.seasonId)) + '</span></td><td>' + U.esc(U.CAT_LABEL[r.category] || '—') + '</td><td>' + U.mapBadge(U.PRIORITY, r.priority) + '</td><td>' + U.mapBadge(U.REQ_STATUS, r.status) + '</td><td>' + (r.responses.length ? r.responses.length + ' phản hồi' : '<span class="muted">Chưa có</span>') + '</td><td>' + U.fmtDateTime(r.createdAt) + '</td>' +
        '<td><button class="btn btn-sm btn-outline" data-view="' + r.id + '">' + U.icon('eye') + ' Xem</button></td></tr>').join('') + '</tbody></table></div>';
  }

  /* ---------- chi tiết ---------- */
  function resultHtml(a) {
    return '<div class="stack" style="gap:8px"><div class="row"><strong>Nhóm vấn đề:</strong> ' + U.badge('info', U.CAT_LABEL[a.category] || '—') + ' <strong>Mức độ:</strong> ' + U.mapBadge(U.PRIORITY, a.severity) + '</div>' +
      '<div class="conf"><strong>Độ tin cậy mô phỏng:</strong><div class="progress" role="progressbar" aria-valuenow="' + a.confidence + '" aria-valuemin="0" aria-valuemax="100"><span style="width:' + a.confidence + '%"></span></div><span>' + a.confidence + '%</span></div>' +
      '<h4>Giải thích</h4><ul>' + a.explanation.map((x) => '<li>' + U.esc(x) + '</li>').join('') + '</ul><h4>Gợi ý bước tiếp theo</h4><ul>' + a.nextSteps.map((x) => '<li>' + U.esc(x) + '</li>').join('') + '</ul></div>';
  }

  function detail(id) {
    const r = S.find('helpRequests', id); if (!r) return;
    const body =
      '<dl class="kv"><dt>Trạng thái</dt><dd>' + U.mapBadge(U.REQ_STATUS, r.status) + '</dd><dt>Mức ưu tiên</dt><dd>' + U.mapBadge(U.PRIORITY, r.priority) + '</dd><dt>Nhóm vấn đề</dt><dd>' + U.esc(U.CAT_LABEL[r.category] || '—') + '</dd>' +
      '<dt>Mùa vụ</dt><dd>' + U.esc(Q.seasonName(r.seasonId)) + ' · ' + U.esc(Q.cropName(r.cropId)) + ' · ' + U.esc(r.stage) + '</dd><dt>Gửi lúc</dt><dd>' + U.fmtDateTime(r.createdAt) + '</dd>' +
      '<dt>Chuyên gia</dt><dd>' + (r.expertId ? U.esc(Q.userName(r.expertId)) : '<span class="muted">Chưa có người tiếp nhận</span>') + '</dd><dt>Mô tả</dt><dd>' + U.nl2br(r.description) + '</dd>' +
      (r.images.length ? '<dt>Ảnh</dt><dd><div class="thumbs">' + r.images.map((s) => '<img src="' + s + '" alt="Ảnh minh họa" data-zoom>').join('') + '</div></dd>' : '') + '</dl>' +
      (r.aiResult ? '<h3 style="margin:18px 0 8px">Gợi ý AI đã lưu <span class="tag-ai">Mô phỏng</span></h3><div class="quote">' + resultHtml(r.aiResult) + '</div>' : '') +
      '<h3 style="margin:20px 0 10px">Phản hồi từ chuyên gia</h3>' +
      (r.responses.length ? '<ol class="timeline">' + r.responses.map((x) => {
        const res = x.resourceId ? S.find('resources', x.resourceId) : null;
        return '<li><div class="row spread"><strong>' + U.esc(Q.userName(x.expertId)) + '</strong><span class="small muted">' + U.fmtDateTime(x.date) + '</span></div><p>' + U.nl2br(x.text) + '</p>' + (res ? '<p class="small">Tài liệu tham khảo: <a href="' + U.esc(res.url) + '" target="_blank" rel="noopener">' + U.esc(res.title) + '</a></p>' : '') + '<p style="margin-top:4px">' + U.mapBadge(U.REQ_STATUS, x.status) + '</p></li>';
      }).join('') + '</ol>' : '<div class="alert info">' + U.icon('alert') + '<div>Chưa có phản hồi. Chuyên gia sẽ tiếp nhận yêu cầu sớm nhất có thể.</div></div>');
    const foot = (r.status === 'pending' ? '<button class="btn btn-outline" data-edit-req="' + r.id + '">' + U.icon('edit') + ' Sửa yêu cầu</button><button class="btn btn-danger" data-cancel-req="' + r.id + '">Hủy yêu cầu</button>' : '') + '<button class="btn btn-outline" data-close>Đóng</button>';
    const m = U.openModal({ title: r.title, size: 'lg', body: body, footer: foot, autofocus: false });
    m.el.addEventListener('click', async (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.editReq) { m.close(); requestForm(S.find('helpRequests', b.dataset.editReq)); }
      if (b.dataset.cancelReq) {
        if (await U.confirm({ title: 'Hủy yêu cầu', message: 'Hủy yêu cầu này? Chuyên gia sẽ không còn thấy nó trong hàng chờ.', confirmText: 'Hủy yêu cầu', cancelText: 'Giữ lại', danger: true })) {
          S.update('helpRequests', r.id, { status: 'cancelled', updatedAt: new Date().toISOString() });
          m.close(); U.toast('Đã hủy yêu cầu.'); list();
        }
      }
    });
  }

  /* ---------- form tạo/sửa + AI-1 ---------- */
  function requestForm(r) {
    const ss = seasons();
    if (!ss.length) { U.toast('Bạn cần có mùa vụ đang canh tác để gửi yêu cầu.', 'warn'); return; }
    let ai = r && r.aiResult ? r.aiResult : null;
    const m = U.openModal({
      title: r ? 'Sửa yêu cầu hỗ trợ' : 'Tạo yêu cầu hỗ trợ', size: 'lg',
      body: '<form id="rf" novalidate><div class="form-grid">' +
        U.field({ name: 'seasonId', label: 'Mùa vụ', type: 'select', options: ss.map((s) => ({ value: s.id, label: s.name + ' — ' + Q.cropName(s.cropId) })), blank: 'Chọn mùa vụ', required: true, value: r ? r.seasonId : (ss.length === 1 ? ss[0].id : '') }) +
        U.field({ name: 'stage', label: 'Giai đoạn phát triển', type: 'select', options: CM.STAGES, blank: 'Chọn giai đoạn', required: true, value: r ? r.stage : (ss.length === 1 ? ss[0].stage : '') }) +
        U.field({ name: 'title', label: 'Tiêu đề', required: true, value: r ? r.title : '', placeholder: 'Ví dụ: Lá cà chua có đốm nâu', full: true }) +
        U.field({ name: 'description', label: 'Mô tả vấn đề', type: 'textarea', rows: 4, required: true, value: r ? r.description : '', placeholder: 'Triệu chứng, vị trí, thời điểm bắt đầu, đã xử lý gì…', help: 'Mô tả càng cụ thể, AI mô phỏng và chuyên gia càng dễ hỗ trợ.', full: true }) +
        '<div class="field full"><span class="label">Ảnh minh họa (không bắt buộc)</span><div id="pick"></div></div>' +
        '<div class="full" id="ai1" style="margin-bottom:14px"></div>' +
        U.field({ name: 'category', label: 'Nhóm vấn đề', type: 'select', options: CM.CATEGORIES, required: true, value: r ? r.category : 'other' }) +
        U.field({ name: 'priority', label: 'Mức ưu tiên', type: 'select', options: CM.PRIORITIES, required: true, value: r ? r.priority : 'medium' }) +
        '</div></form>',
      footer: '<button class="btn btn-outline" data-close>Hủy</button><button class="btn" form="rf" type="submit">' + U.icon('send') + (r ? ' Lưu thay đổi' : ' Gửi yêu cầu') + '</button>',
      autofocus: false,
    });
    const form = U.qs('#rf', m.el); U.clearErrorsOnInput(form);
    const pick = U.imagePicker(U.qs('#pick', m.el), r ? r.images : [], 3);
    form.elements.seasonId.addEventListener('change', () => { const s = Q.season(form.elements.seasonId.value); if (s) form.elements.stage.value = s.stage; });

    const catOpts = CM.CATEGORIES, sevOpts = CM.PRIORITIES;
    U.aiPanel(U.qs('#ai1', m.el), {
      title: 'Phân loại vấn đề cây trồng (AI-1)',
      intro: 'AI mô phỏng đọc mô tả, cây trồng và giai đoạn để gợi ý nhóm vấn đề, mức độ nghiêm trọng và bước tiếp theo.',
      runLabel: 'Phân loại vấn đề',
      acceptLabel: 'Chấp nhận & áp dụng vào yêu cầu',
      getInput() {
        const s = Q.season(form.elements.seasonId.value);
        return { description: form.elements.description.value, title: form.elements.title.value, cropId: s ? s.cropId : '', stage: form.elements.stage.value, imageCount: pick.get().length };
      },
      run: (input, attempt, opts) => CM.ai.classifyIssue(input, attempt, opts),
      renderResult: resultHtml,
      renderEditor(d) {
        return '<div class="form-grid">' + U.field({ name: 'aiCategory', label: 'Nhóm vấn đề', type: 'select', options: catOpts, value: d.category }) + U.field({ name: 'aiSeverity', label: 'Mức độ nghiêm trọng', type: 'select', options: sevOpts, value: d.severity }) +
          U.field({ name: 'aiSteps', label: 'Gợi ý bước tiếp theo (mỗi dòng một bước)', type: 'textarea', rows: 4, value: d.nextSteps.join('\n'), full: true }) + '</div>';
      },
      readEditor(root, d) {
        const steps = root.querySelector('[name=aiSteps]').value.split('\n').map((x) => x.trim()).filter(Boolean);
        if (!steps.length) { U.toast('Cần ít nhất một bước tiếp theo.', 'warn'); return null; }
        return Object.assign({}, d, { category: root.querySelector('[name=aiCategory]').value, severity: root.querySelector('[name=aiSeverity]').value, nextSteps: steps });
      },
      onAccept(d, mode) {
        ai = Object.assign({}, d, { mode: mode, simulated: true });
        form.elements.category.value = d.category; form.elements.priority.value = d.severity;
        return 'Đã áp dụng nhóm vấn đề và mức ưu tiên vào biểu mẫu. Kết quả AI sẽ được lưu cùng yêu cầu khi bạn gửi.';
      },
      onReject() { ai = null; },
      onSupplement() { form.elements.description.focus(); },
      onManual() { form.elements.category.focus(); },
      manualLabel: 'Chọn nhóm vấn đề thủ công',
    });

    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const ok = U.validate(form, {
        seasonId: { label: 'Mùa vụ', required: true },
        stage: { label: 'Giai đoạn', required: true },
        title: { label: 'Tiêu đề', required: true, min: 8, max: 120 },
        description: { label: 'Mô tả vấn đề', required: true, min: 20, max: 1200 },
        category: { label: 'Nhóm vấn đề', required: true },
      });
      if (!ok) return;
      const d = U.formData(form), s = Q.season(d.seasonId), now = new Date().toISOString();
      const rec = { seasonId: d.seasonId, cropId: s.cropId, stage: d.stage, title: d.title, description: d.description, category: d.category, priority: d.priority, images: pick.get(), aiResult: ai, updatedAt: now };
      let saved;
      if (r) saved = S.update('helpRequests', r.id, rec);
      else {
        saved = S.create('helpRequests', Object.assign({ farmerId: me.id, status: 'pending', expertId: null, responses: [], aiSummary: null, createdAt: now }, rec));
        if (saved) S.notify({ role: 'expert' }, d.priority === 'urgent' ? 'Yêu cầu khẩn cấp mới' : 'Yêu cầu hỗ trợ mới', me.name + ': "' + d.title + '"', 'pages/expert/expert-request-detail.html?id=' + saved.id);
      }
      if (!saved) { U.toast('Không lưu được: bộ nhớ trình duyệt đã đầy. Hãy xóa bớt ảnh.', 'error'); return; }
      m.close(); U.toast(r ? 'Đã cập nhật yêu cầu.' : 'Đã gửi yêu cầu. Chuyên gia sẽ thấy yêu cầu trong hàng chờ.'); list();
    });
  }

  view.addEventListener('click', (e) => {
    const t = e.target.closest('button'); if (!t) return;
    if (t.hasAttribute('data-new')) requestForm(null);
    else if (t.dataset.view) detail(t.dataset.view);
  });

  U.withLoading(view, shell);
})();
