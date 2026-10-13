/* CropMate AI — lớp dữ liệu dùng chung (LocalStorage).
   Mọi trang đọc/ghi qua CM.store; không hardcode dữ liệu trong từng trang. */
(function () {
  const CM = (window.CM = window.CM || {});
  const PREFIX = 'cropmate.v1.';
  const ENTITIES = ['users', 'farms', 'fields', 'crops', 'seasons', 'fieldLogs', 'helpRequests', 'resources', 'notifications', 'calendarEvents', 'checklists', 'seasonSummaries'];
  const mem = {}; // dự phòng khi trình duyệt chặn LocalStorage

  function hasLS() {
    try { localStorage.setItem(PREFIX + 'probe', '1'); localStorage.removeItem(PREFIX + 'probe'); return true; } catch (e) { return false; }
  }
  const LS = hasLS();

  function rawGet(k) {
    try { return LS ? localStorage.getItem(PREFIX + k) : mem[k] || null; } catch (e) { return null; }
  }
  function rawSet(k, v) {
    if (!LS) { mem[k] = v; return true; }
    try { localStorage.setItem(PREFIX + k, v); return true; }
    catch (e) { CM.store.lastError = e; return false; }
  }

  const store = (CM.store = {
    lastError: null,
    ENTITIES: ENTITIES,

    /** Nạp dữ liệu ban đầu nếu chưa có. */
    init() {
      if (rawGet('seeded')) {
        // bổ sung entity còn thiếu nếu phiên bản dữ liệu cũ
        ENTITIES.forEach((e) => { if (rawGet(e) === null) rawSet(e, '[]'); });
        return;
      }
      const seed = CM.seedData();
      ENTITIES.forEach((e) => rawSet(e, JSON.stringify(seed[e] || [])));
      rawSet('seeded', new Date().toISOString());
    },
    reset() {
      ENTITIES.concat(['seeded']).forEach((e) => { try { localStorage.removeItem(PREFIX + e); } catch (x) { delete mem[e]; } });
      store.init();
    },
    all(entity) {
      try { return JSON.parse(rawGet(entity) || '[]'); } catch (e) { return []; }
    },
    replaceAll(entity, list) { return rawSet(entity, JSON.stringify(list)); },
    find(entity, id) { return store.all(entity).find((x) => x.id === id) || null; },
    where(entity, fn) { return store.all(entity).filter(fn); },
    uid(prefix) { return (prefix || 'id') + '-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); },
    create(entity, record) {
      const list = store.all(entity);
      const rec = Object.assign({ id: store.uid(entity.slice(0, 2)) }, record);
      list.push(rec);
      return store.replaceAll(entity, list) ? rec : null;
    },
    update(entity, id, patch) {
      const list = store.all(entity);
      const i = list.findIndex((x) => x.id === id);
      if (i < 0) return null;
      list[i] = Object.assign({}, list[i], patch);
      return store.replaceAll(entity, list) ? list[i] : null;
    },
    remove(entity, id) {
      const list = store.all(entity);
      const next = list.filter((x) => x.id !== id);
      if (next.length === list.length) return false;
      return store.replaceAll(entity, next);
    },

    /* ---- thông báo ---- */
    notify(target, title, text, link) {
      // target: {userId} hoặc {role}
      return store.create('notifications', {
        userId: target.userId || null, role: target.role || null,
        title: title, text: text, link: link || '', date: new Date().toISOString(), readBy: [],
      });
    },
    notificationsFor(user) {
      return store.all('notifications')
        .filter((n) => n.userId === user.id || (n.role && n.role === user.role))
        .sort((a, b) => (a.date < b.date ? 1 : -1));
    },
    unreadCount(user) {
      return store.notificationsFor(user).filter((n) => !(n.readBy || []).includes(user.id)).length;
    },
  });

  /* ---- truy vấn quan hệ dùng chung giữa các role ---- */
  CM.q = {
    farmsOf(userId) { return store.where('farms', (f) => f.ownerId === userId); },
    seasonsOfFarmer(userId) {
      const ids = CM.q.farmsOf(userId).map((f) => f.id);
      return store.where('seasons', (s) => ids.includes(s.farmId));
    },
    user(id) { return store.find('users', id); },
    userName(id) { const u = store.find('users', id); return u ? u.name : '—'; },
    crop(id) { return store.find('crops', id); },
    cropName(id) { const c = store.find('crops', id); return c ? c.name : '—'; },
    farm(id) { return store.find('farms', id); },
    season(id) { return store.find('seasons', id); },
    seasonName(id) { const s = store.find('seasons', id); return s ? s.name : '—'; },
    checklistOf(seasonId) { return store.all('checklists').find((c) => c.seasonId === seasonId) || null; },
    progressOf(seasonId) {
      const cl = CM.q.checklistOf(seasonId);
      if (!cl || !cl.items.length) return { total: 0, done: 0, pct: 0, overdue: 0 };
      const t = CM.today();
      const done = cl.items.filter((i) => i.status === 'done').length;
      const overdue = cl.items.filter((i) => i.status !== 'done' && i.dueDate && i.dueDate < t).length;
      return { total: cl.items.length, done: done, pct: Math.round((done / cl.items.length) * 100), overdue: overdue };
    },
    isOpen(r) { return r.status === 'pending' || r.status === 'processing'; },
  };

  CM.today = function () {
    const d = new Date();
    const p = (x) => String(x).padStart(2, '0');
    return d.getFullYear() + '-' + p(d.getMonth() + 1) + '-' + p(d.getDate());
  };

  store.init();
})();
