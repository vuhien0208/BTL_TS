/* CropMate AI — ba tính năng AI MÔ PHỎNG bằng JavaScript (rule-based).
   Không gọi LLM/API thật. Mọi kết quả đều có cờ simulated:true để giao diện ghi rõ. */
(function () {
  const CM = (window.CM = window.CM || {});
  const delay = (ms) => new Promise((r) => setTimeout(r, ms));
  const N = (s) => CM.ui.norm(s);

  /* ============ AI-1: Field Issue Classifier ============ */
  const RULES = {
    pest: { label: 'Sâu bệnh', words: ['sau', 'ray', 'ray nau', 'benh', 'nam', 'dom', 'dom nau', 'chet', 'lan nhanh', 'ruoi', 'oc', 'bo tri', 'sau cuon la', 'thoi', 'moc', 'vet den', 'dao on', 'chay la', 'rep'] },
    water: { label: 'Thiếu nước', words: ['kho', 'han', 'thieu nuoc', 'heo', 'nang nong', 'nut', 'rung qua', 'tuoi', 'nang han', 'rung hoa', 'kho hat', 'khong nay mam'] },
    nutrient: { label: 'Thiếu dinh dưỡng', words: ['vang la', 'vang nhat', 'cham lon', 'coi coc', 'thieu dam', 'thieu phan', 'thieu kali', 'tim la', 'la nho', 'bac mau', 'phan', 'dam', 'kali', 'long'] },
  };
  const SEVERE_WORDS = ['lan nhanh', 'chet', 'hang loat', 'nghiem trong', 'mat trang', 'toan bo', 'rat nhieu', 'nhieu', 'khan cap'];
  const NEXT = {
    pest: ['Chụp ảnh cận cảnh lá/thân bị hại và vị trí lan rộng.', 'Cách ly hoặc loại bỏ phần cây bị hại nặng, vệ sinh dụng cụ.', 'Gửi yêu cầu để chuyên gia tư vấn hoạt chất phù hợp, tránh tự phun liều cao.'],
    water: ['Kiểm tra độ ẩm đất ở 10–15 cm dưới mặt đất.', 'Điều chỉnh lịch tưới theo buổi sáng sớm hoặc chiều mát.', 'Theo dõi lại sau 2–3 ngày và ghi vào nhật ký.'],
    nutrient: ['Đối chiếu lịch bón phân gần nhất trong nhật ký.', 'Quan sát vị trí vàng lá: lá già hay lá non để dự đoán nguyên tố thiếu.', 'Nhờ chuyên gia xác nhận trước khi bón bổ sung.'],
    other: ['Bổ sung ảnh và thời điểm bắt đầu xuất hiện triệu chứng.', 'Gửi yêu cầu để chuyên gia xem xét trực tiếp.'],
  };

  CM.ai = {
    /** @returns {Promise<{status, data?, message?, missing?}>} */
    async classifyIssue(input, attempt, opts) {
      await delay(900);
      if (opts && opts.forceError) return { status: 'error', message: 'Dịch vụ phân loại mô phỏng đang bị tạm dừng (do bạn bật "Mô phỏng lỗi hệ thống").' };
      const text = N(input.description + ' ' + (input.title || ''));
      const missing = [];
      if (input.description.trim().length < 20) missing.push('Mô tả vấn đề cần ít nhất 20 ký tự.');
      if (!input.cropId) missing.push('Chưa chọn loại cây trồng.');
      if (!input.stage) missing.push('Chưa chọn giai đoạn phát triển.');
      if (missing.length) return { status: 'insufficient', message: 'Cần thêm thông tin để AI mô phỏng có căn cứ phân loại.', missing: missing };

      const scored = Object.keys(RULES).map((k) => {
        const hits = RULES[k].words.filter((w) => text.includes(w));
        return { key: k, hits: hits, score: hits.length };
      }).sort((a, b) => b.score - a.score);

      const best = scored[0], second = scored[1];
      let pick = best;
      if (attempt > 0 && second.score > 0 && (attempt % 2 === 1)) pick = second; // "tạo lại" → giả thuyết thay thế

      if (best.score === 0) {
        return { status: 'uncertain', message: 'Mô tả chưa chứa dấu hiệu rõ ràng của sâu bệnh, thiếu nước hay thiếu dinh dưỡng. Hãy mô tả cụ thể hơn về màu lá, vị trí, thời điểm xuất hiện.', data: this._pack('other', 0, [], input, false) };
      }
      const gap = best.score - second.score;
      const conf = Math.min(92, Math.round(48 + pick.score * 11 + (pick === best ? gap * 7 : -10)));
      if (pick === best && gap === 0 && best.score < 2) {
        return { status: 'uncertain', message: 'Các dấu hiệu trong mô tả phù hợp với nhiều nhóm vấn đề cùng lúc.', data: this._pack(pick.key, Math.min(conf, 52), pick.hits, input, true) };
      }
      return { status: 'ok', data: this._pack(pick.key, conf, pick.hits, input, pick !== best) };
    },

    _pack(category, confidence, hits, input, alt) {
      const text = N(input.description);
      let sev = 'medium';
      const sevHits = SEVERE_WORDS.filter((w) => text.includes(w));
      if (sevHits.length >= 2) sev = 'urgent'; else if (sevHits.length === 1) sev = 'high';
      else if (input.description.length < 60 && hits.length <= 1) sev = 'low';
      const crop = CM.q.cropName(input.cropId);
      const expl = [];
      if (hits.length) expl.push('Mô tả có các dấu hiệu liên quan: ' + hits.slice(0, 5).map((h) => '"' + h + '"').join(', ') + '.');
      else expl.push('Không tìm thấy từ khóa đặc trưng trong mô tả.');
      expl.push('Cây trồng: ' + crop + ', giai đoạn: ' + input.stage + '.');
      if (sevHits.length) expl.push('Mức độ được nâng lên do mô tả có dấu hiệu lan rộng/nghiêm trọng (' + sevHits.slice(0, 3).join(', ') + ').');
      if (input.imageCount) expl.push('Có ' + input.imageCount + ' ảnh đính kèm — mô phỏng KHÔNG phân tích nội dung ảnh, chỉ ghi nhận có ảnh để chuyên gia xem.');
      if (alt) expl.push('Đây là giả thuyết thay thế sau khi tạo lại.');
      return { category: category, severity: sev, confidence: confidence, explanation: expl, nextSteps: NEXT[category] || NEXT.other, simulated: true };
    },

    /* ============ AI-2: Season Checklist Generator ============ */
    async generateChecklist(input, attempt, opts) {
      await delay(900);
      if (opts && opts.forceError) return { status: 'error', message: 'Không kết nối được dịch vụ tạo checklist mô phỏng (do bạn bật "Mô phỏng lỗi hệ thống").' };
      const missing = [];
      if (!input.cropId) missing.push('Chưa chọn cây trồng.');
      if (!input.stage || CM.STAGES.indexOf(input.stage) < 0) missing.push('Chưa chọn giai đoạn mùa vụ hợp lệ.');
      if (!input.startDate) missing.push('Chưa có ngày bắt đầu giai đoạn.');
      if (missing.length) return { status: 'insufficient', message: 'AI mô phỏng cần cây trồng, giai đoạn và ngày bắt đầu để lập lịch.', missing: missing };

      const crop = CM.q.crop(input.cropId);
      const cat = crop ? crop.category : '';
      const T = {
        'Chuẩn bị đất': [
          ['Làm sạch cỏ và tàn dư vụ trước', 'Dọn sạch ruộng, xử lý rơm rạ/tàn dư để hạn chế mầm bệnh.', 0],
          ['Cày xới và san phẳng mặt ruộng', 'Làm đất tơi xốp, san phẳng để nước phân bố đều.', 3],
          ['Bón lót phân hữu cơ/vôi cải tạo', 'Bón lót theo khuyến cáo địa phương, trộn đều vào đất.', 6],
          ['Kiểm tra hệ thống tưới tiêu', 'Kiểm tra mương, máy bơm, đường ống trước khi gieo.', 8],
        ],
        'Gieo trồng': [
          ['Chọn và xử lý giống', 'Chọn giống sạch bệnh, ngâm ủ/xử lý giống trước khi gieo.', 0],
          ['Gieo trồng đúng mật độ', 'Gieo/trồng theo khoảng cách khuyến cáo cho ' + (crop ? crop.name : 'cây trồng') + '.', 2],
          ['Tưới giữ ẩm sau gieo', 'Giữ ẩm đều, tránh ngập úng hoặc khô mặt đất.', 3],
          ['Dặm lại chỗ thiếu cây', 'Kiểm tra tỷ lệ nảy mầm và dặm lại các vị trí trống.', 9],
        ],
        'Chăm sóc': [
          ['Làm cỏ và vệ sinh đồng ruộng', 'Làm cỏ đợt đầu, loại bỏ cây bệnh nhỏ lẻ.', 3],
          ['Bón thúc đợt 1', 'Bón thúc theo giai đoạn, chia nhỏ lượng phân.', 7],
          ['Kiểm tra sâu bệnh định kỳ', 'Đi ruộng theo đường chéo, ghi lại mật độ và triệu chứng vào nhật ký.', 10],
          ['Điều chỉnh nước tưới', 'Giữ ẩm hợp lý theo thời tiết, tránh tưới tràn lan.', 12],
          ['Bón thúc đợt 2', 'Bổ sung dinh dưỡng theo sinh trưởng thực tế.', 20],
        ],
        'Ra hoa – đậu quả': [
          ['Bón phân giai đoạn ra hoa', 'Ưu tiên kali và vi lượng, hạn chế đạm thừa.', 1],
          ['Tỉa cành/lá già để thông thoáng', 'Giảm độ ẩm tán lá, hạn chế nấm bệnh.', 4],
          ['Phòng bệnh sau mưa', 'Phun phòng vào sáng sớm khi trời ráo, ghi lại thuốc đã dùng.', 6],
          ['Theo dõi rụng hoa, rụng quả non', 'Ghi nhận tỷ lệ rụng và điều kiện thời tiết.', 8],
          ['Tưới ổn định giai đoạn nuôi quả', 'Duy trì độ ẩm đều, tránh sốc nước.', 10],
        ],
        'Thu hoạch': [
          ['Ngừng thuốc BVTV theo thời gian cách ly', 'Kiểm tra nhãn thuốc, đảm bảo đủ thời gian cách ly trước thu hoạch.', 0],
          ['Kiểm tra độ chín thu hoạch', 'Lấy mẫu kiểm tra độ chín, quyết định thời điểm thu.', 2],
          ['Chuẩn bị nhân công, dụng cụ, nơi tập kết', 'Chuẩn bị bao bì, thiết bị, kho/bãi phơi.', 3],
          ['Thu hoạch và phân loại', 'Thu đúng độ chín, phân loại và ghi sản lượng.', 5],
          ['Ghi sản lượng và đánh giá vụ', 'Ghi vào nhật ký để phục vụ báo cáo tổng kết.', 8],
        ],
      };
      let tasks = (T[input.stage] || []).map((t) => ({ title: t[0], desc: t[1], offset: t[2] }));
      // điều chỉnh theo nhóm cây
      if (cat === 'Lương thực' && input.stage === 'Chăm sóc') tasks.push({ title: 'Quản lý mực nước ruộng', desc: 'Giữ mực nước phù hợp theo từng giai đoạn sinh trưởng.', offset: 14 });
      if (cat === 'Rau màu' && input.stage === 'Chăm sóc') tasks.push({ title: 'Tỉa thưa và vun gốc', desc: 'Tỉa cây yếu, vun gốc giúp rễ phát triển.', offset: 8 });
      if (cat === 'Cây công nghiệp' && input.stage === 'Chăm sóc') tasks.push({ title: 'Cắt tỉa tạo tán', desc: 'Tạo tán thông thoáng, loại bỏ cành vượt.', offset: 15 });
      if (attempt > 0) { // "tạo lại": thay đổi thứ tự/giãn lịch để có biến thể
        tasks = tasks.slice().reverse().map((t, i) => ({ title: t.title, desc: t.desc, offset: i * 3 + (attempt % 3) }));
      }
      const start = new Date(input.startDate + 'T12:00:00');
      const items = tasks.map((t, i) => {
        const d = new Date(start); d.setDate(d.getDate() + t.offset);
        const p = (x) => String(x).padStart(2, '0');
        return { id: CM.store.uid('ci') + i, title: t.title, desc: t.desc, dueDate: d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate()), status: 'todo', stage: input.stage };
      }).sort((a, b) => (a.dueDate < b.dueDate ? -1 : 1));

      if (items.length < 3) return { status: 'uncertain', message: 'AI mô phỏng chưa có đủ mẫu công việc cho tổ hợp cây trồng và giai đoạn này.', data: { items: items, crop: crop ? crop.name : '', stage: input.stage, explanation: [], simulated: true } };
      return {
        status: 'ok',
        data: {
          items: items, crop: crop ? crop.name : '', stage: input.stage, simulated: true,
          explanation: [
            'Dựa trên cây trồng "' + (crop ? crop.name : '') + '" (nhóm ' + (cat || 'khác') + ') và giai đoạn "' + input.stage + '".',
            'Ngày dự kiến được tính từ ngày bắt đầu ' + CM.ui.fmtDate(input.startDate) + ', cách nhau theo khoảng cách thường dùng trong thực tế.',
            'Danh sách là mẫu tham khảo, hãy chỉnh theo điều kiện thực tế của thửa ruộng.',
          ],
        },
      };
    },

    /* ============ AI-3: Farm Log Summarizer ============ */
    async summarizeSeason(input, attempt, opts) {
      await delay(1000);
      if (opts && opts.forceError) return { status: 'error', message: 'Dịch vụ tóm tắt mô phỏng đang bị tạm dừng (do bạn bật "Mô phỏng lỗi hệ thống").' };
      const season = CM.q.season(input.seasonId);
      if (!season) return { status: 'insufficient', message: 'Không tìm thấy mùa vụ liên quan.', missing: ['Yêu cầu chưa gắn với mùa vụ.'] };
      const logs = CM.store.where('fieldLogs', (l) => l.seasonId === season.id && !l.archived).sort((a, b) => (a.date < b.date ? -1 : 1));
      const reqs = CM.store.where('helpRequests', (r) => r.seasonId === season.id);
      if (logs.length < 2) return { status: 'insufficient', message: 'Mùa vụ cần ít nhất 2 bản ghi nhật ký để tóm tắt có căn cứ.', missing: ['Hiện có ' + logs.length + ' bản ghi nhật ký cho mùa vụ này.'] };

      const byAct = {};
      logs.forEach((l) => { byAct[l.activity] = (byAct[l.activity] || 0) + 1; });
      const acts = Object.keys(byAct).sort((a, b) => byAct[b] - byAct[a]);
      const first = logs[0], last = logs[logs.length - 1];
      const issueLogs = logs.filter((l) => /rầy|sâu|bệnh|đốm|vàng|rụng|khô|héo|nấm/i.test(l.note));
      const cl = CM.q.checklistOf(season.id);
      const pending = cl ? cl.items.filter((i) => i.status !== 'done') : [];
      const overdue = pending.filter((i) => i.dueDate < CM.today());
      const openReqs = reqs.filter(CM.q.isOpen);

      const overview = 'Mùa vụ "' + season.name + '" (' + CM.q.cropName(season.cropId) + ') đang ở giai đoạn "' + season.stage + '". Từ ' + CM.ui.fmtDate(first.date) + ' đến ' + CM.ui.fmtDate(last.date) + ' có ' + logs.length + ' bản ghi nhật ký và ' + reqs.length + ' yêu cầu hỗ trợ.';
      const done = acts.map((a) => a + ' (' + byAct[a] + ' lần)');
      const issues = [];
      issueLogs.slice(-3).forEach((l) => issues.push(CM.ui.fmtDate(l.date) + ': ' + l.note));
      reqs.forEach((r) => issues.push('Yêu cầu "' + r.title + '" — ' + (CM.ui.REQ_STATUS[r.status] || ['', r.status])[1].toLowerCase() + '.'));
      const backlog = [];
      overdue.forEach((i) => backlog.push('Trễ hạn ' + CM.ui.fmtDate(i.dueDate) + ': ' + i.title));
      pending.filter((i) => i.dueDate >= CM.today()).slice(0, 3).forEach((i) => backlog.push('Sắp tới ' + CM.ui.fmtDate(i.dueDate) + ': ' + i.title));
      openReqs.forEach((r) => backlog.push('Yêu cầu chưa đóng: ' + r.title));
      const follow = [];
      if (overdue.length) follow.push('Ưu tiên hoàn thành ' + overdue.length + ' công việc đã trễ hạn.');
      if (issueLogs.length) follow.push('Theo dõi lại khu vực có triệu chứng sau 3–5 ngày và ghi vào nhật ký.');
      if (openReqs.length) follow.push('Cập nhật kết quả xử lý cho các yêu cầu hỗ trợ đang mở.');
      if (!follow.length) follow.push('Duy trì ghi nhật ký đều đặn theo từng hoạt động.');
      if (attempt > 0) follow.push('(Bản tạo lại) Kiểm tra thêm điều kiện thời tiết gần đây khi đánh giá.');

      return {
        status: 'ok',
        data: {
          seasonId: season.id, overview: overview, done: done, issues: issues.length ? issues : ['Chưa ghi nhận vấn đề nổi bật trong nhật ký.'],
          backlog: backlog.length ? backlog : ['Không có việc tồn đọng.'], follow: follow, simulated: true,
          basis: 'Căn cứ: ' + logs.length + ' nhật ký, ' + reqs.length + ' yêu cầu hỗ trợ' + (cl ? ', ' + cl.items.length + ' công việc checklist' : ', chưa có checklist') + '.',
          explanation: ['Tóm tắt được tạo trực tiếp từ nhật ký canh tác, yêu cầu hỗ trợ và checklist của mùa vụ.', 'Việc "nổi bật" được chọn khi ghi chú có từ khóa như rầy, sâu, bệnh, đốm, vàng, rụng, khô.'],
        },
      };
    },
  };
})();
