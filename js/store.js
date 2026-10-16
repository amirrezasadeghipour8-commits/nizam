/* Nizam — ذخیره‌سازی: حافظهٔ محلی به‌عنوان کش و منبع آفلاین، Supabase به‌عنوان
   مقصد همگام‌سازی. load/save/clear ناهمگام شده‌اند؛ خطای شبکه هرگز دادهٔ محلی
   را از بین نمی‌برد. */
(function (root) {
  'use strict';

  var Defaults = root.Defaults || (typeof require !== 'undefined' ? require('./defaults.js') : null);
  var KEY_PREFIX = 'nizam.v1'; // کلید قدیمی هم همین است و یکبار مهاجرت می‌شود
  var REMOTE_TIMEOUT = 5000;

  /* کلید کش محلی به کاربر گره می‌خورد تا کاربر بعدی روی همان مرورگر
     دادهٔ کاربر قبلی را نبیند. هر بار از نشست فعلی خوانده می‌شود. */
  function key() {
    var s = session();
    return s ? (KEY_PREFIX + '.' + s.user.id) : (KEY_PREFIX + '.anonymous');
  }

  /* مهاجرت یکباره: دادهٔ کلید قدیمی (بدون شناسهٔ کاربر) به کلید کاربرِ
     واردشده منتقل و کلید قدیمی پاک می‌شود تا به کاربر بعدی نرسد. */
  function migrateLegacyKey() {
    if (!session()) return;
    var legacy;
    try { legacy = storage.getItem(KEY_PREFIX); } catch (e) { return; }
    if (legacy === null) return;
    try {
      var target = key();
      if (storage.getItem(target) === null) storage.setItem(target, legacy);
      storage.removeItem(KEY_PREFIX);
    } catch (e) { /* بی‌اهمیت */ }
  }

  function memoryStorage() {
    var map = {};
    return {
      getItem: function (k) { return Object.prototype.hasOwnProperty.call(map, k) ? map[k] : null; },
      setItem: function (k, v) { map[k] = String(v); },
      removeItem: function (k) { delete map[k]; }
    };
  }

  var storage = (typeof localStorage !== 'undefined') ? localStorage : memoryStorage();

  function isPlainObject(v) {
    return v && typeof v === 'object' && !Array.isArray(v);
  }

  /* یکسان‌سازی داده‌های ذخیره‌شده با ساختار پیش‌فرض (مهاجرت سبک) */
  function normalize(saved) {
    var base = Defaults.defaultState();
    if (!isPlainObject(saved)) return base;

    var out = base;
    out.version = saved.version || 1;
    if (isPlainObject(saved.settings)) {
      out.settings = Object.assign(base.settings, saved.settings);
    }
    if (Array.isArray(saved.templates)) out.templates = saved.templates;
    if (isPlainObject(saved.schedules)) {
      out.schedules = {
        regular: Array.isArray(saved.schedules.regular) ? saved.schedules.regular : base.schedules.regular,
        gym: Array.isArray(saved.schedules.gym) ? saved.schedules.gym : base.schedules.gym,
        friday: Array.isArray(saved.schedules.friday) ? saved.schedules.friday : base.schedules.friday,
        free: Array.isArray(saved.schedules.free) ? saved.schedules.free : base.schedules.free
      };
    }
    if (Array.isArray(saved.weekdayFocus)) out.weekdayFocus = saved.weekdayFocus;
    if (isPlainObject(saved.targets)) out.targets = Object.assign(base.targets, saved.targets);
    if (isPlainObject(saved.days)) out.days = saved.days;
    if (isPlainObject(saved.reviews)) out.reviews = saved.reviews;
    if (isPlainObject(saved.learning)) {
      out.learning = Object.assign(base.learning, saved.learning);
      if (Array.isArray(saved.learning.steps)) out.learning.steps = saved.learning.steps;
      if (Array.isArray(saved.learning.sessions)) out.learning.sessions = saved.learning.sessions;
    }
    if (isPlainObject(saved.driving)) {
      out.driving = Object.assign(base.driving, saved.driving);
      if (Array.isArray(saved.driving.stages)) out.driving.stages = saved.driving.stages;
    }
    if (isPlainObject(saved.roadmap)) {
      out.roadmap = Object.assign(base.roadmap, saved.roadmap);
      if (Array.isArray(saved.roadmap.phases)) {
        out.roadmap.phases = saved.roadmap.phases.map(function (ph) {
          if (ph && Array.isArray(ph.goals)) {
            ph.goals = ph.goals.map(function (g) {
              return typeof g === 'string' ? { text: g, done: false } : g;
            });
          }
          return ph;
        });
      }
    }
    if (isPlainObject(saved.meta)) out.meta = Object.assign(base.meta, saved.meta);
    return out;
  }

  /* ---------- دسترسی به Supabase (فقط در صورت وجود کلاینت و نشست) ---------- */
  function client() {
    return (typeof window !== 'undefined' && window.supabaseClient) ? window.supabaseClient : null;
  }
  function session() {
    var s = (typeof window !== 'undefined') ? window.supabaseSession : null;
    return (s && s.user) ? s : null;
  }
  /* شبکه نباید راه‌اندازی یا ذخیره را معطل کند؛ هر درخواست سقف زمانی دارد. */
  function withTimeout(p, ms) {
    return new Promise(function (resolve, reject) {
      var t = setTimeout(function () { reject(new Error('درخواست Supabase تمام نشد')); }, ms);
      p.then(function (v) { clearTimeout(t); resolve(v); },
             function (e) { clearTimeout(t); reject(e); });
    });
  }
  function readLocal() {
    try {
      var raw = storage.getItem(key());
      if (!raw) return null;
      return normalize(JSON.parse(raw));
    } catch (e) { return null; }
  }

  /* دریافت وضعیت از ردیف کاربر. مقدار null یعنی «از کش محلی استفاده کن». */
  async function loadFromSupabase() {
    var sc = client();
    var sess = session();
    if (!sc || !sess) return null;
    try {
      var res = await withTimeout(
        sc.from('user_state').select('data').eq('user_id', sess.user.id).maybeSingle(),
        REMOTE_TIMEOUT);
      if (res.error) throw res.error;

      if (res.data && res.data.data != null) {
        var remote = normalize(res.data.data);          // normalize روی دادهٔ Supabase هم اجرا می‌شود
        storage.setItem(key(), JSON.stringify(remote));   // کش محلی به‌روز می‌شود
        return remote;
      }

      /* ردیفی نیست: اگر کش محلی داریم همان را اولین ردیف می‌کنیم (مهاجرت از
         نسخهٔ محلی)، وگرنه حالت پیش‌فرض را می‌سازیم. */
      var seed = readLocal() || Defaults.defaultState();
      var ins = await withTimeout(
        sc.from('user_state').upsert({ user_id: sess.user.id, data: seed }), REMOTE_TIMEOUT);
      if (ins.error) throw ins.error;
      storage.setItem(key(), JSON.stringify(seed));
      return seed;
    } catch (e) {
      console.warn('Nizam: دریافت از Supabase ناموفق؛ از حافظهٔ محلی استفاده می‌شود', e);
      return null;
    }
  }

  /* ارسال‌ها صف می‌شوند تا نوشتن قدیمی‌تر روی دادهٔ تازه‌تر ننویسد. */
  var pushChain = Promise.resolve();
  function pushToSupabase(json) {
    var sc = client();
    var sess = session();
    if (!sc || !sess) return;
    pushChain = pushChain.then(function () {
      return withTimeout(
        sc.from('user_state').upsert({ user_id: sess.user.id, data: JSON.parse(json) }),
        REMOTE_TIMEOUT
      ).then(function (res) {
        if (res.error) throw res.error;
      });
    }).catch(function (e) {
      console.warn('Nizam: همگام‌سازی Supabase ناموفق؛ داده در حافظهٔ محلی محفوظ است', e);
    });
  }

  /* هماهنگ‌کننده: اول Supabase (در صورت نشست)، بعد کش محلی. */
  async function load() {
    migrateLegacyKey(); // کلید قدیمی (اگر باشد) به کاربرِ واردشده منتقل می‌شود
    var local = readLocal(); // پیش از دریافت: وضعیت فعلی کش (دریافت راه دور کش را بازنویسی می‌کند)
    var remote = await loadFromSupabase();
    if (remote && local) {
      /* ویرایش‌های آفلاین نباید با نسخهٔ قدیمی‌ترِ راه دور بازنویسی شوند */
      var rT = (remote.meta && remote.meta.updatedAt) || '';
      var lT = (local.meta && local.meta.updatedAt) || '';
      if (lT > rT) {
        storage.setItem(key(), JSON.stringify(local)); // کش تازه‌تر را نگه می‌داریم
        return local;
      }
    }
    if (remote) return remote;
    if (local) return local;
    return Defaults.defaultState();
  }

  /* نوشتن محلی همین لحظه (بخش همگام)؛ ارسال به Supabase در پس‌زمینه ادامه
     می‌یابد. مقدار برگشتی مثل قبل: true یعنی نوشتن محلی موفق بود. */
  async function save(state) {
    var ok = true;
    var json = null;
    try {
      state.meta = state.meta || {};
      state.meta.updatedAt = new Date().toISOString();
      json = JSON.stringify(state);
      storage.setItem(key(), json);
    } catch (e) {
      ok = false; // حافظهٔ مرورگر پر شد — فراخواننده هشدار می‌دهد
    }
    if (json) pushToSupabase(json);
    return ok;
  }

  /* فقط کش محلی را پاک می‌کند؛ ردیف Supabase دست‌نخورده می‌ماند
     (خروج از حساب نباید دادهٔ کاربر را پاک کند). */
  async function clear() {
    try { storage.removeItem(key()); } catch (e) { /* بی‌اهمیت */ }
  }

  function exportJSON(state) {
    return JSON.stringify(state, null, 2);
  }

  function importJSON(text) {
    var obj = JSON.parse(text);
    if (!isPlainObject(obj)) throw new Error('فایل پشتیبان معتبر نیست.');
    if (!isPlainObject(obj.days) && !isPlainObject(obj.settings)) {
      throw new Error('ساختار فایل پشتیبان با این برنامه سازگار نیست.');
    }
    return normalize(obj);
  }

  var api = {
    KEY: KEY_PREFIX, // پیشوند کلید؛ کلید واقعی به کاربر گره می‌خورد (key)
    normalize: normalize,
    load: load,
    save: save,
    exportJSON: exportJSON,
    importJSON: importJSON,
    clear: clear,
    loadFromSupabase: loadFromSupabase,
    key: key,
    _storage: storage
  };

  root.Store = api;
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
})(typeof window !== 'undefined' ? window : globalThis);
