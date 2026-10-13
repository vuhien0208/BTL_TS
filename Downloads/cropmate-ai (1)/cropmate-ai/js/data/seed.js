/* CropMate AI — dữ liệu khởi tạo tập trung.
   Chỉ được nạp vào LocalStorage khi chưa có dữ liệu (xem storage.js).
   Ngày được tính tương đối so với ngày chạy lần đầu để luôn có dữ liệu "trễ hạn", "sắp tới". */
(function () {
  const CM = (window.CM = window.CM || {});

  CM.STAGES = ['Chuẩn bị đất', 'Gieo trồng', 'Chăm sóc', 'Ra hoa – đậu quả', 'Thu hoạch'];
  CM.ACTIVITIES = ['Làm đất', 'Gieo trồng', 'Bón phân', 'Tưới nước', 'Phun thuốc', 'Làm cỏ', 'Kiểm tra sinh trưởng', 'Thu hoạch', 'Khác'];
  CM.CATEGORIES = [
    { value: 'pest', label: 'Sâu bệnh' },
    { value: 'water', label: 'Thiếu nước' },
    { value: 'nutrient', label: 'Thiếu dinh dưỡng' },
    { value: 'other', label: 'Vấn đề khác' },
  ];
  CM.PRIORITIES = [
    { value: 'low', label: 'Thấp' },
    { value: 'medium', label: 'Trung bình' },
    { value: 'high', label: 'Cao' },
    { value: 'urgent', label: 'Khẩn cấp' },
  ];
  CM.ROLES = [
    { value: 'farmer', label: 'Nông dân' },
    { value: 'expert', label: 'Chuyên gia' },
    { value: 'coordinator', label: 'Điều phối HTX' },
    { value: 'admin', label: 'Quản trị viên' },
  ];

  function D(n) {
    const d = new Date();
    d.setHours(12, 0, 0, 0);
    d.setDate(d.getDate() + n);
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  }
  function T(n, h) {
    return D(n) + 'T' + String(h || 8).padStart(2, '0') + ':00:00';
  }

  CM.seedData = function () {
    return {
      users: [
        { id: 'u-farmer1', name: 'Nguyễn Văn Hải', email: 'farmer@cropmate.vn', password: 'Farmer@123', phone: '0912345601', role: 'farmer', status: 'active', createdAt: D(-120) },
        { id: 'u-farmer2', name: 'Trần Thị Mai', email: 'farmer2@cropmate.vn', password: 'Farmer@123', phone: '0912345602', role: 'farmer', status: 'active', createdAt: D(-100) },
        { id: 'u-farmer3', name: 'Lê Văn Tâm', email: 'tam.le@cropmate.vn', password: 'Farmer@123', phone: '0912345603', role: 'farmer', status: 'inactive', createdAt: D(-90) },
        { id: 'u-expert1', name: 'TS. Phạm Quốc Bảo', email: 'expert@cropmate.vn', password: 'Expert@123', phone: '0912345611', role: 'expert', status: 'active', createdAt: D(-150) },
        { id: 'u-expert2', name: 'ThS. Võ Thị Lan', email: 'expert2@cropmate.vn', password: 'Expert@123', phone: '0912345612', role: 'expert', status: 'active', createdAt: D(-140) },
        { id: 'u-coord1', name: 'Đặng Minh Châu', email: 'coordinator@cropmate.vn', password: 'Coord@123', phone: '0912345621', role: 'coordinator', status: 'active', createdAt: D(-160) },
        { id: 'u-admin1', name: 'Hoàng Quản Trị', email: 'admin@cropmate.vn', password: 'Admin@123', phone: '0912345631', role: 'admin', status: 'active', createdAt: D(-200) },
      ],
      crops: [
        { id: 'c-lua', name: 'Lúa', category: 'Lương thực', cycleDays: 105, description: 'Lúa nước, canh tác theo vụ Đông Xuân, Hè Thu, Thu Đông.', status: 'active' },
        { id: 'c-ngo', name: 'Ngô', category: 'Lương thực', cycleDays: 95, description: 'Ngô lai trồng trên đất bãi và đất thịt nhẹ.', status: 'active' },
        { id: 'c-ca-chua', name: 'Cà chua', category: 'Rau màu', cycleDays: 100, description: 'Cà chua trồng giàn, thu hoạch nhiều đợt.', status: 'active' },
        { id: 'c-rau-cai', name: 'Rau cải', category: 'Rau màu', cycleDays: 30, description: 'Rau ngắn ngày, chu kỳ nhanh.', status: 'active' },
        { id: 'c-ca-phe', name: 'Cà phê', category: 'Cây công nghiệp', cycleDays: 270, description: 'Cà phê vối trồng vùng Tây Nguyên.', status: 'active' },
        { id: 'c-tieu', name: 'Hồ tiêu', category: 'Cây công nghiệp', cycleDays: 300, description: 'Tạm dừng theo dõi trong hệ thống.', status: 'inactive' },
      ],
      farms: [
        { id: 'f-1', ownerId: 'u-farmer1', name: 'Trang trại Hải Lúa', address: 'Xã Tân Lập, huyện Mộc Hóa, Long An', status: 'active' },
        { id: 'f-2', ownerId: 'u-farmer2', name: 'Vườn rau Mai Hương', address: 'Phường 8, TP. Đà Lạt, Lâm Đồng', status: 'active' },
        { id: 'f-3', ownerId: 'u-farmer3', name: 'Nông hộ Tâm Phát', address: 'Xã Ea Kao, TP. Buôn Ma Thuột, Đắk Lắk', status: 'inactive' },
      ],
      fields: [
        { id: 'fd-1', farmId: 'f-1', name: 'Thửa A1', area: 2.5, cropId: 'c-lua' },
        { id: 'fd-2', farmId: 'f-1', name: 'Thửa A2', area: 1.2, cropId: 'c-ngo' },
        { id: 'fd-3', farmId: 'f-2', name: 'Thửa B1', area: 0.8, cropId: 'c-ca-chua' },
        { id: 'fd-4', farmId: 'f-2', name: 'Thửa B2', area: 0.5, cropId: 'c-rau-cai' },
        { id: 'fd-5', farmId: 'f-3', name: 'Thửa C1', area: 3.0, cropId: 'c-ca-phe' },
      ],
      seasons: [
        { id: 's-1', farmId: 'f-1', fieldId: 'fd-1', cropId: 'c-lua', name: 'Lúa Thu Đông 2026', startDate: D(-50), endDate: D(55), stage: 'Chăm sóc', status: 'active', note: 'Giống OM18, sạ hàng.' },
        { id: 's-2', farmId: 'f-1', fieldId: 'fd-2', cropId: 'c-ngo', name: 'Ngô vụ 3 – 2026', startDate: D(-20), endDate: D(75), stage: 'Gieo trồng', status: 'active', note: '' },
        { id: 's-3', farmId: 'f-2', fieldId: 'fd-3', cropId: 'c-ca-chua', name: 'Cà chua đông 2026', startDate: D(-70), endDate: D(30), stage: 'Ra hoa – đậu quả', status: 'active', note: 'Trồng giàn, tưới nhỏ giọt.' },
        { id: 's-4', farmId: 'f-2', fieldId: 'fd-4', cropId: 'c-rau-cai', name: 'Rau cải xanh tháng 10', startDate: D(-10), endDate: D(20), stage: 'Chăm sóc', status: 'active', note: '' },
        { id: 's-5', farmId: 'f-3', fieldId: 'fd-5', cropId: 'c-ca-phe', name: 'Cà phê niên vụ 2026', startDate: D(-100), endDate: D(80), stage: 'Ra hoa – đậu quả', status: 'active', note: '' },
        { id: 's-6', farmId: 'f-1', fieldId: 'fd-1', cropId: 'c-lua', name: 'Lúa Hè Thu 2026', startDate: D(-200), endDate: D(-90), stage: 'Thu hoạch', status: 'completed', note: 'Năng suất đạt 6,2 tấn/ha.' },
      ],
      fieldLogs: [
        { id: 'l-1', seasonId: 's-1', farmerId: 'u-farmer1', date: D(-48), activity: 'Gieo trồng', note: 'Sạ hàng 120 kg giống/ha, mực nước ruộng 3 cm.', images: [], archived: false },
        { id: 'l-2', seasonId: 's-1', farmerId: 'u-farmer1', date: D(-30), activity: 'Bón phân', note: 'Bón thúc đợt 1: 100 kg NPK 20-20-15 cho cả thửa.', images: [], archived: false },
        { id: 'l-3', seasonId: 's-1', farmerId: 'u-farmer1', date: D(-14), activity: 'Kiểm tra sinh trưởng', note: 'Lúa đẻ nhánh đều, phát hiện vài ổ rầy nâu ở góc ruộng phía Đông.', images: [], archived: false },
        { id: 'l-4', seasonId: 's-1', farmerId: 'u-farmer1', date: D(-9), activity: 'Phun thuốc', note: 'Phun thuốc trừ rầy theo khuyến cáo, 2 bình/1000 m².', images: [], archived: false },
        { id: 'l-5', seasonId: 's-1', farmerId: 'u-farmer1', date: D(-3), activity: 'Tưới nước', note: 'Bơm nước bổ sung do nắng nóng kéo dài, giữ mực nước 5 cm.', images: [], archived: false },
        { id: 'l-6', seasonId: 's-2', farmerId: 'u-farmer1', date: D(-18), activity: 'Làm đất', note: 'Cày xới, lên luống rộng 1,2 m.', images: [], archived: false },
        { id: 'l-7', seasonId: 's-2', farmerId: 'u-farmer1', date: D(-12), activity: 'Gieo trồng', note: 'Gieo 2 hạt/hốc, khoảng cách 70 x 25 cm.', images: [], archived: false },
        { id: 'l-8', seasonId: 's-3', farmerId: 'u-farmer2', date: D(-40), activity: 'Bón phân', note: 'Bón lót phân hữu cơ vi sinh trước khi lên giàn.', images: [], archived: false },
        { id: 'l-9', seasonId: 's-3', farmerId: 'u-farmer2', date: D(-12), activity: 'Kiểm tra sinh trưởng', note: 'Lá già có đốm nâu, mép lá vàng. Cây vẫn ra hoa bình thường.', images: [], archived: false },
        { id: 'l-10', seasonId: 's-3', farmerId: 'u-farmer2', date: D(-5), activity: 'Phun thuốc', note: 'Phun phòng nấm bệnh sau mưa kéo dài.', images: [], archived: false },
        { id: 'l-11', seasonId: 's-4', farmerId: 'u-farmer2', date: D(-8), activity: 'Gieo trồng', note: 'Gieo hạt rau cải xanh, phủ rơm mỏng.', images: [], archived: false },
        { id: 'l-12', seasonId: 's-4', farmerId: 'u-farmer2', date: D(-2), activity: 'Tưới nước', note: 'Tưới phun sương buổi sáng và chiều.', images: [], archived: false },
      ],
      helpRequests: [
        {
          id: 'hr-1', farmerId: 'u-farmer1', seasonId: 's-1', cropId: 'c-lua', stage: 'Chăm sóc',
          title: 'Rầy nâu xuất hiện ở góc ruộng phía Đông',
          description: 'Cuối tuần trước phát hiện nhiều rầy nâu bám gốc lúa ở khoảng 200 m² góc phía Đông. Đã phun một lần nhưng vẫn còn rầy, cây bắt đầu vàng ở gốc.',
          category: 'pest', priority: 'high', status: 'processing', expertId: 'u-expert1', images: [],
          responses: [{ id: 'rs-1', expertId: 'u-expert1', text: 'Anh/chị giữ mực nước thấp, tránh bón đạm thêm. Phun luân phiên hoạt chất khác nhóm sau 5–7 ngày và chụp ảnh gốc lúa gửi lại để theo dõi.', status: 'processing', date: T(-2, 9), resourceId: 'r-1' }],
          aiResult: { category: 'pest', severity: 'high', confidence: 78, mode: 'accepted', explanation: ['Mô tả có từ khóa "rầy", "vàng ở gốc".'], nextSteps: ['Kiểm tra mật độ rầy'], simulated: true },
          aiSummary: null, createdAt: T(-4, 7), updatedAt: T(-2, 9),
        },
        {
          id: 'hr-2', farmerId: 'u-farmer2', seasonId: 's-3', cropId: 'c-ca-chua', stage: 'Ra hoa – đậu quả',
          title: 'Lá cà chua có đốm nâu lan nhanh sau mưa',
          description: 'Sau 3 ngày mưa liên tục, lá già có đốm nâu viền vàng, đốm lan nhanh lên lá non. Một vài quả non có vết đen ở cuống. Cần tư vấn thuốc và cách xử lý.',
          category: 'pest', priority: 'urgent', status: 'pending', expertId: null, images: [], responses: [],
          aiResult: null, aiSummary: null, createdAt: T(-1, 16), updatedAt: T(-1, 16),
        },
        {
          id: 'hr-3', farmerId: 'u-farmer2', seasonId: 's-4', cropId: 'c-rau-cai', stage: 'Chăm sóc',
          title: 'Lá rau cải vàng nhạt, cây chậm lớn',
          description: 'Rau cải sau gieo 8 ngày, lá vàng nhạt từ lá già, cây chậm lớn hơn các luống khác. Nghi thiếu đạm nhưng chưa chắc.',
          category: 'nutrient', priority: 'medium', status: 'pending', expertId: null, images: [], responses: [],
          aiResult: null, aiSummary: null, createdAt: T(-1, 9), updatedAt: T(-1, 9),
        },
        {
          id: 'hr-4', farmerId: 'u-farmer1', seasonId: 's-2', cropId: 'c-ngo', stage: 'Gieo trồng',
          title: 'Hạt ngô nảy mầm không đều',
          description: 'Gieo ngô 12 ngày, một số hốc chưa lên mầm, một số hốc mọc rất yếu. Đất khá khô vào ban ngày.',
          category: 'water', priority: 'medium', status: 'resolved', expertId: 'u-expert2', images: [],
          responses: [
            { id: 'rs-2', expertId: 'u-expert2', text: 'Tưới nhẹ buổi sáng sớm giữ ẩm đều, dặm lại các hốc trống trong 3 ngày tới bằng hạt đã ngâm ủ.', status: 'processing', date: T(-9, 10), resourceId: null },
            { id: 'rs-3', expertId: 'u-expert2', text: 'Đã hướng dẫn xong, hạn chế để đất khô nứt. Đóng yêu cầu khi cây lên đều.', status: 'resolved', date: T(-6, 15), resourceId: null },
          ],
          aiResult: null, aiSummary: null, createdAt: T(-10, 8), updatedAt: T(-6, 15),
        },
        {
          id: 'hr-5', farmerId: 'u-farmer3', seasonId: 's-5', cropId: 'c-ca-phe', stage: 'Ra hoa – đậu quả',
          title: 'Rụng quả non hàng loạt',
          description: 'Cà phê đang đậu quả nhưng rụng quả non nhiều sau đợt nắng nóng, cần tư vấn tưới và bón.',
          category: 'water', priority: 'high', status: 'rejected', expertId: 'u-expert2', images: [],
          responses: [{ id: 'rs-4', expertId: 'u-expert2', text: 'Yêu cầu thiếu ảnh và vị trí vườn. Vui lòng bổ sung thông tin rồi gửi lại.', status: 'rejected', date: T(-20, 11), resourceId: null }],
          aiResult: null, aiSummary: null, createdAt: T(-22, 8), updatedAt: T(-20, 11),
        },
      ],
      resources: [
        { id: 'r-1', title: 'Quản lý rầy nâu hại lúa', type: 'Hướng dẫn', cropId: 'c-lua', summary: 'Nhận biết, ngưỡng phòng trừ và nguyên tắc luân phiên hoạt chất.', url: 'https://example.org/ipm-ray-nau', authorId: 'u-expert1', updatedAt: D(-30) },
        { id: 'r-2', title: 'Lịch bón phân cho ngô vụ 3', type: 'Tài liệu', cropId: 'c-ngo', summary: 'Các đợt bón lót, thúc theo giai đoạn sinh trưởng.', url: 'https://example.org/bon-phan-ngo', authorId: 'u-expert2', updatedAt: D(-45) },
        { id: 'r-3', title: 'Phòng bệnh đốm lá trên cà chua', type: 'Hướng dẫn', cropId: 'c-ca-chua', summary: 'Vệ sinh vườn, thông thoáng giàn và phun phòng sau mưa.', url: 'https://example.org/benh-do-la', authorId: 'u-expert1', updatedAt: D(-12) },
        { id: 'r-4', title: 'Video: Tưới nhỏ giọt cho rau màu', type: 'Video', cropId: 'c-rau-cai', summary: 'Lắp đặt và điều chỉnh lượng nước theo giai đoạn.', url: 'https://example.org/tuoi-nho-giot', authorId: 'u-expert2', updatedAt: D(-60) },
        { id: 'r-5', title: 'Biểu mẫu ghi nhật ký vụ mùa', type: 'Biểu mẫu', cropId: '', summary: 'Mẫu ghi chép chuẩn cho mọi loại cây trồng.', url: 'https://example.org/mau-nhat-ky', authorId: 'u-expert1', updatedAt: D(-90) },
        { id: 'r-6', title: 'Chăm sóc cà phê giai đoạn đậu quả', type: 'Tài liệu', cropId: 'c-ca-phe', summary: 'Cân đối nước và dinh dưỡng giai đoạn đậu quả.', url: 'https://example.org/ca-phe-dau-qua', authorId: 'u-expert2', updatedAt: D(-25) },
      ],
      checklists: [
        {
          id: 'cl-1', seasonId: 's-1', source: 'ai-simulation', updatedAt: D(-20),
          items: [
            { id: 'ci-1', title: 'Bón thúc đợt 1', desc: 'Bón thúc sau sạ 18–20 ngày.', dueDate: D(-30), status: 'done', stage: 'Chăm sóc' },
            { id: 'ci-2', title: 'Kiểm tra rầy và sâu cuốn lá', desc: 'Đi ruộng theo đường chéo, ghi mật độ.', dueDate: D(-4), status: 'todo', stage: 'Chăm sóc' },
            { id: 'ci-3', title: 'Bón thúc đợt 2 (đón đòng)', desc: 'Bón kali và đạm vừa phải.', dueDate: D(4), status: 'todo', stage: 'Chăm sóc' },
            { id: 'ci-4', title: 'Rút nước phơi ruộng', desc: 'Giữ ruộng ẩm, tránh khô nứt.', dueDate: D(10), status: 'todo', stage: 'Chăm sóc' },
          ],
        },
        {
          id: 'cl-2', seasonId: 's-3', source: 'manual', updatedAt: D(-10),
          items: [
            { id: 'ci-5', title: 'Tỉa lá già và chồi nách', desc: 'Giữ giàn thông thoáng.', dueDate: D(-6), status: 'todo', stage: 'Ra hoa – đậu quả' },
            { id: 'ci-6', title: 'Phun phòng bệnh sau mưa', desc: 'Phun vào sáng sớm, không phun khi trời nắng gắt.', dueDate: D(-2), status: 'todo', stage: 'Ra hoa – đậu quả' },
            { id: 'ci-7', title: 'Bón thúc kali', desc: 'Tăng chất lượng quả.', dueDate: D(5), status: 'doing', stage: 'Ra hoa – đậu quả' },
          ],
        },
      ],
      calendarEvents: [
        { id: 'ev-1', title: 'Họp điều phối tuần HTX', date: D(2), type: 'meeting', farmId: '', note: 'Phòng họp HTX, 8:00.', createdBy: 'u-coord1' },
        { id: 'ev-2', title: 'Kiểm tra đồng ruộng Trang trại Hải Lúa', date: D(4), type: 'inspection', farmId: 'f-1', note: 'Kiểm tra góc ruộng có rầy nâu.', createdBy: 'u-coord1' },
        { id: 'ev-3', title: 'Tập huấn phòng bệnh cây rau màu', date: D(7), type: 'meeting', farmId: '', note: 'Mời nông hộ vùng Đà Lạt.', createdBy: 'u-coord1' },
        { id: 'ev-4', title: 'Lịch tưới đợt 2 – Vườn rau Mai Hương', date: D(1), type: 'care', farmId: 'f-2', note: '', createdBy: 'u-coord1' },
        { id: 'ev-5', title: 'Tổng kết vụ Hè Thu', date: D(-5), type: 'meeting', farmId: 'f-1', note: 'Đã hoàn thành.', createdBy: 'u-coord1' },
      ],
      seasonSummaries: [
        { id: 'ss-1', seasonId: 's-6', title: 'Báo cáo tổng kết Lúa Hè Thu 2026', yieldValue: 6.2, content: 'Vụ Hè Thu hoàn thành đúng kế hoạch. Diện tích 2,5 ha, năng suất 6,2 tấn/ha.\nVấn đề nổi bật: rầy nâu giai đoạn đẻ nhánh, đã xử lý kịp thời.\nĐề xuất vụ sau: tăng cường theo dõi sâu bệnh định kỳ và bố trí lịch bón phân sớm hơn.', status: 'final', createdBy: 'u-coord1', createdAt: D(-85) },
      ],
      notifications: [
        { id: 'n-1', userId: 'u-farmer1', role: null, title: 'Chuyên gia đã phản hồi', text: 'TS. Phạm Quốc Bảo đã gửi tư vấn cho yêu cầu "Rầy nâu xuất hiện ở góc ruộng phía Đông".', link: 'pages/farmer/farmer-help-request.html?id=hr-1', date: T(-2, 9), readBy: [] },
        { id: 'n-2', userId: null, role: 'expert', title: 'Yêu cầu khẩn cấp mới', text: 'Có yêu cầu khẩn cấp: "Lá cà chua có đốm nâu lan nhanh sau mưa".', link: 'pages/expert/expert-request-detail.html?id=hr-2', date: T(-1, 16), readBy: [] },
        { id: 'n-3', userId: null, role: 'coordinator', title: 'Việc trễ hạn cần theo dõi', text: 'Có công việc trễ hạn tại Trang trại Hải Lúa và Vườn rau Mai Hương.', link: 'pages/coordinator/coordinator-farm-overview.html', date: T(-1, 8), readBy: [] },
        { id: 'n-4', userId: 'u-farmer2', role: null, title: 'Công việc sắp đến hạn', text: 'Checklist "Bón thúc kali" đến hạn sau 5 ngày.', link: 'pages/farmer/farmer-checklist.html', date: T(0, 6), readBy: [] },
        { id: 'n-5', userId: null, role: 'admin', title: 'Tài khoản bị vô hiệu hóa', text: 'Tài khoản Lê Văn Tâm đang ở trạng thái vô hiệu hóa.', link: 'pages/admin/admin-user-management.html', date: T(-7, 9), readBy: [] },
      ],
    };
  };
})();
